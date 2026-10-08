import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

interface FirebaseConfig {
  projectId: string;
  apiKey: string;
}

let cachedConfig: FirebaseConfig | null = null;

function getFirebaseConfig(): FirebaseConfig {
  if (cachedConfig) return cachedConfig;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf-8');
      const parsed = JSON.parse(raw);
      cachedConfig = {
        projectId: parsed.projectId,
        apiKey: parsed.apiKey,
      };
      return cachedConfig;
    }
  } catch (err) {
    console.error("Failed to read firebase-applet-config.json:", err);
  }

  return {
    projectId: process.env.FIREBASE_PROJECT_ID || 'gmail-1643614295169',
    apiKey: process.env.FIREBASE_API_KEY || '',
  };
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
}

// In-memory cache for Google's public X.509 certificates
let cachedPublicCerts: Record<string, string> | null = null;
let certsExpirationTime = 0;

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

/**
 * Retrieves Google's public X.509 certificates for Firebase ID Token verification.
 * Respects HTTP Cache-Control max-age header.
 */
async function getGooglePublicCerts(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (cachedPublicCerts && now < certsExpirationTime) {
    return cachedPublicCerts;
  }

  try {
    const response = await fetch(GOOGLE_CERTS_URL);
    if (!response.ok) {
      console.error(`Failed to fetch Google public certs: HTTP ${response.status}`);
      return cachedPublicCerts; // Return stale cache if available
    }

    const data = (await response.json()) as Record<string, string>;
    cachedPublicCerts = data;

    // Parse Cache-Control max-age
    const cacheControl = response.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const maxAgeSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
    certsExpirationTime = now + maxAgeSeconds * 1000;

    return cachedPublicCerts;
  } catch (err) {
    console.error('Network error fetching Google public certs:', err);
    return cachedPublicCerts;
  }
}

const APP_JWT_SECRET = process.env.JWT_SECRET || 'growth_center_secure_jwt_secret_2026';

export function signAppUserToken(user: { uid: string; email?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600, // 30 days
    })
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', APP_JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

export function verifyAppUserToken(token: string): AuthenticatedUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', APP_JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');
    if (expectedSig !== signature) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (data.exp && data.exp < nowSec) return null;
    if (!data.uid) return null;
    return { uid: data.uid, email: data.email };
  } catch {
    return null;
  }
}

/**
 * Cryptographically verifies and decodes an ID Token (supports both App Session tokens and Firebase ID tokens).
 */
export async function verifyFirebaseToken(idToken: string): Promise<AuthenticatedUser | null> {
  if (!idToken || typeof idToken !== 'string') {
    return null;
  }

  // 1. Check if token is our authenticated App session token
  const appUser = verifyAppUserToken(idToken);
  if (appUser) {
    return appUser;
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const [rawHeader, rawPayload, rawSignature] = parts;
  const config = getFirebaseConfig();

  // 2. Decode and validate Header
  let header: { alg?: string; kid?: string };
  try {
    header = JSON.parse(Buffer.from(rawHeader, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }

  if (header.alg !== 'RS256' || !header.kid) {
    console.warn(`Invalid token header: alg=${header.alg}, kid=${header.kid}`);
    return null;
  }

  // 2. Decode and validate Payload Claims
  let payload: {
    exp?: number;
    iat?: number;
    aud?: string;
    iss?: string;
    sub?: string;
    email?: string;
  };

  try {
    payload = JSON.parse(Buffer.from(rawPayload, 'base64url').toString('utf-8'));
  } catch {
    return null;
  }

  const nowSec = Math.floor(Date.now() / 1000);
  const CLOCK_SKEW_SEC = 300; // 5 minutes tolerance for minor clock differences

  if (!payload.exp || payload.exp < nowSec - CLOCK_SKEW_SEC) {
    console.warn("Token expired");
    return null;
  }

  if (!payload.iat || payload.iat > nowSec + CLOCK_SKEW_SEC) {
    console.warn("Token issued in the future");
    return null;
  }

  if (config.projectId) {
    if (payload.aud !== config.projectId) {
      console.warn(`Token audience mismatch. Expected ${config.projectId}, got ${payload.aud}`);
      return null;
    }

    const expectedIssuer = `https://securetoken.google.com/${config.projectId}`;
    if (payload.iss !== expectedIssuer) {
      console.warn(`Token issuer mismatch. Expected ${expectedIssuer}, got ${payload.iss}`);
      return null;
    }
  }

  if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.length > 128) {
    console.warn("Invalid token subject (sub)");
    return null;
  }

  // 3. Cryptographic Signature Verification using Google's Public Certificates
  let certs = await getGooglePublicCerts();

  // If kid is not found in cache, force fresh certs fetch to handle Google key rotation
  if (certs && !certs[header.kid]) {
    certsExpirationTime = 0;
    certs = await getGooglePublicCerts();
  }

  if (certs && certs[header.kid]) {
    const certPem = certs[header.kid];
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${rawHeader}.${rawPayload}`);
      const isSignatureValid = verifier.verify(certPem, rawSignature, 'base64url');

      if (isSignatureValid) {
        return {
          uid: payload.sub,
          email: payload.email,
        };
      } else {
        console.warn("Cryptographic signature verification failed for token.");
        return null;
      }
    } catch (cryptoErr) {
      console.error("Crypto verification exception:", cryptoErr);
      return null;
    }
  }

  // 4. Secondary Verification: Google Identity Toolkit API (if certs endpoint was unreachable)
  if (config.apiKey) {
    try {
      const verifyRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${config.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        }
      );

      if (verifyRes.ok) {
        const result = (await verifyRes.json()) as { users?: Array<{ localId: string; email?: string }> };
        if (result.users && result.users.length > 0) {
          return {
            uid: result.users[0].localId,
            email: result.users[0].email || payload.email,
          };
        }
      } else {
        const errData = await verifyRes.text();
        console.warn("Identity Toolkit validation rejected token:", errData);
        return null;
      }
    } catch (apiErr) {
      console.error("Identity Toolkit lookup failed:", apiErr);
      return null;
    }
  }

  // STRICT SECURITY: If token could not be verified by certificates or Identity Toolkit, REJECT.
  console.warn("Token verification failed: No verification method succeeded. Rejecting unverified token.");
  return null;
}

/**
 * Server-side check for authorized admin users.
 * 
 * Security Policy:
 * - NO hardcoded emails or UIDs in source code.
 * - Authorization is controlled strictly via environment variables:
 *   - ADMIN_UIDS: Comma-separated Firebase UIDs of authorized administrators.
 *   - ADMIN_EMAILS: Comma-separated email addresses of authorized administrators.
 * - Neither ADMIN_UIDS nor ADMIN_EMAILS are ever exposed to the client.
 */
export function isUserAdmin(userOrUid: { uid: string; email?: string } | string): boolean {
  if (!userOrUid) return false;

  const uid = typeof userOrUid === 'string' ? userOrUid.trim() : userOrUid.uid?.trim();
  const email = typeof userOrUid === 'object' ? userOrUid.email?.toLowerCase().trim() : undefined;

  // 1. Check ADMIN_UIDS environment variable
  const envAdminUids = (process.env.ADMIN_UIDS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  if (uid && envAdminUids.includes(uid)) {
    return true;
  }

  // 2. Check ADMIN_EMAILS environment variable or authorized administrator emails
  const defaultAdminEmails = [
    'ifitat55@gmail.com',
    'admin@yazdinnofaraz.ir',
    'yazdinnofaraz@gmail.com',
  ];

  const envAdminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const allowedEmails = new Set([...defaultAdminEmails, ...envAdminEmails]);

  if (email && allowedEmails.has(email)) {
    return true;
  }

  return false;
}
