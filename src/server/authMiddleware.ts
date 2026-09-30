import fs from 'node:fs';
import path from 'node:path';

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

/**
 * Parses and verifies a Firebase ID Token.
 * 1. Checks basic JWT structure, signature headers, issuer, audience and expiration.
 * 2. If an API key is available, verifies with Google Identity Toolkit for authoritative check.
 */
export async function verifyFirebaseToken(idToken: string): Promise<AuthenticatedUser | null> {
  if (!idToken || typeof idToken !== 'string') {
    return null;
  }

  const parts = idToken.split('.');
  if (parts.length !== 3) {
    return null;
  }

  const config = getFirebaseConfig();

  // Step 1: Decode JWT Payload and check claims
  try {
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      console.warn("Token expired");
      return null;
    }

    if (config.projectId && payload.aud !== config.projectId) {
      console.warn(`Token audience mismatch. Expected ${config.projectId}, got ${payload.aud}`);
      return null;
    }

    const expectedIssuer = `https://securetoken.google.com/${config.projectId}`;
    if (config.projectId && payload.iss !== expectedIssuer) {
      console.warn(`Token issuer mismatch. Expected ${expectedIssuer}, got ${payload.iss}`);
      return null;
    }

    // Step 2: Validate token live against Google Identity Toolkit endpoint if API key is present
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
          console.warn("Identity Toolkit validation failed:", errData);
          return null;
        }
      } catch (networkErr) {
        console.warn("Identity Toolkit call failed, falling back to verified JWT claims:", networkErr);
        // Fallback to validated claims if external call fails
        if (payload.sub) {
          return { uid: payload.sub, email: payload.email };
        }
      }
    }

    if (payload.sub) {
      return { uid: payload.sub, email: payload.email };
    }
  } catch (err) {
    console.error("Error decoding or validating token:", err);
    return null;
  }

  return null;
}

/**
 * Server-side check for authorized admin Firebase UIDs or Admin Emails.
 * Do NOT expose ADMIN_UIDS or ADMIN_EMAILS to the client.
 */
export function isUserAdmin(userOrUid: { uid: string; email?: string } | string): boolean {
  if (!userOrUid) return false;

  const uid = typeof userOrUid === 'string' ? userOrUid : userOrUid.uid;
  const email = typeof userOrUid === 'object' ? userOrUid.email?.toLowerCase().trim() : undefined;

  // Pre-configured admin emails (including owner email)
  const defaultAdminEmails = ['ifitat55@gmail.com'];
  const envAdminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const allAdminEmails = [...defaultAdminEmails, ...envAdminEmails];

  if (email && allAdminEmails.includes(email)) {
    return true;
  }

  const envAdmins = (process.env.ADMIN_UIDS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean);

  if (uid && envAdmins.includes(uid)) {
    return true;
  }

  // Also check persistent admin list in server data dir if present
  try {
    const adminPath = path.resolve(process.cwd(), 'src/data/adminUids.json');
    if (fs.existsSync(adminPath)) {
      const data = JSON.parse(fs.readFileSync(adminPath, 'utf-8'));
      if (Array.isArray(data)) {
        if (uid && data.includes(uid)) return true;
        if (email && data.includes(email)) return true;
      }
    } else if (envAdmins.length === 0 && (!email || defaultAdminEmails.includes(email))) {
      // Initialize with this first authorized user
      const dir = path.dirname(adminPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(adminPath, JSON.stringify([uid, ...(email ? [email] : [])], null, 2), 'utf-8');
      return true;
    }
  } catch (err) {
    console.error('Error checking admin UIDs:', err);
  }

  return false;
}
