import { Router, type Request, type Response } from 'express';
import { streamProjectAdvisor } from './geminiService.ts';
import { verifyFirebaseToken, isUserAdmin, signAppUserToken } from './authMiddleware.ts';
import { checkRateLimit } from './rateLimiter.ts';
import {
  loadKnowledgeBase,
  syncWebsiteContent,
  loadConfiguredDomains,
  saveConfiguredDomains,
  loadAssistantDirection,
  saveAssistantDirection,
  loadSyncStatus,
  synchronizeWebsiteKnowledge,
  DEFAULT_ASSISTANT_DIRECTION,
} from './crawlerService.ts';
import type { ProjectDomainConfig } from '../types/admin.ts';
import { PDFParse } from 'pdf-parse';

export const apiRouter = Router();

// CORS Middleware for embedding on yazdinnofaraz.ir
apiRouter.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin as string;
  const allowedOrigins = [
    'https://yazdinnofaraz.ir',
    'https://www.yazdinnofaraz.ir',
    'http://localhost:3000',
  ];

  if (origin && (allowedOrigins.includes(origin) || origin.endsWith('.run.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health & Version Endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'Yazd InnoFaraz AI Project Advisor',
    version: '2.5.0',
    model: 'gemini-3.1-flash-lite',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// --------------------------------------------------------------------
// Anti-Sanction Proxies for Firebase (Bypasses Iran IP blocks from Google)
// --------------------------------------------------------------------
apiRouter.all(['/proxy-identitytoolkit*', '/proxy-googleapis-identitytoolkit*', '/proxy-securetoken*', '/proxy-firestore*'], async (req: Request, res: Response) => {
  try {
    let targetHost = 'https://identitytoolkit.googleapis.com';
    let pathPrefix = '/proxy-identitytoolkit';

    if (req.originalUrl.includes('/proxy-googleapis-identitytoolkit')) {
      targetHost = 'https://www.googleapis.com/identitytoolkit';
      pathPrefix = '/proxy-googleapis-identitytoolkit';
    } else if (req.originalUrl.includes('/proxy-securetoken')) {
      targetHost = 'https://securetoken.googleapis.com';
      pathPrefix = '/proxy-securetoken';
    } else if (req.originalUrl.includes('/proxy-firestore')) {
      targetHost = 'https://firestore.googleapis.com';
      pathPrefix = '/proxy-firestore';
    }

    const urlParts = req.url.split(pathPrefix);
    const subPath = urlParts.length > 1 ? urlParts[1] : req.url;
    const targetUrl = targetHost + subPath;

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      const lower = key.toLowerCase();
      if (lower !== 'host' && lower !== 'content-length' && typeof value === 'string') {
        headers[key] = value;
      }
    }

    const fetchOptions: RequestInit = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      if (!headers['content-type']) {
        headers['content-type'] = 'application/json';
      }
    }

    const upstreamResponse = await fetch(targetUrl, fetchOptions);
    res.status(upstreamResponse.status);

    const contentType = upstreamResponse.headers.get('content-type');
    if (contentType) res.setHeader('content-type', contentType);

    const bodyText = await upstreamResponse.text();
    res.send(bodyText);
  } catch (err: any) {
    console.error('Firebase Proxy Error:', err?.message || err);
    res.status(502).json({
      error: 'PROXY_FORWARD_FAILED',
      message: err?.message || 'Error forwarding to Google services',
    });
  }
});

// Direct Google OAuth login endpoint (100% reliable for Iran users - no firebaseapp.com)
apiRouter.post('/auth/google-token', async (req: Request, res: Response) => {
  const { accessToken } = req.body || {};
  if (!accessToken) {
    res.status(400).json({ error: 'MISSING_ACCESS_TOKEN', message: 'توکن دسترسی گوگل ارسال نشده است.' });
    return;
  }

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!googleRes.ok) {
      res.status(401).json({
        error: 'INVALID_GOOGLE_TOKEN',
        message: 'اعتبارسنجی حساب گوگل با خطا مواجه شد.',
      });
      return;
    }

    const profile: any = await googleRes.json();
    const user = {
      uid: profile.sub || 'user_' + Date.now(),
      email: profile.email || '',
      displayName: profile.name || profile.email?.split('@')[0] || 'کاربر',
      photoURL: profile.picture || null,
    };

    const token = signAppUserToken(user);
    const isAdmin = isUserAdmin({ uid: user.uid, email: user.email });

    res.json({
      success: true,
      user,
      token,
      isAdmin,
    });
  } catch (err: any) {
    console.error('Google token verification error:', err);
    res.status(500).json({ error: 'AUTH_FAILED', message: err?.message || 'خطا در احراز هویت با گوگل' });
  }
});

// Instant Guest session token for visitors without Google Login
apiRouter.post('/auth/guest-token', (req: Request, res: Response) => {
  let guestId = req.body?.guestId;
  if (!guestId || typeof guestId !== 'string' || !guestId.startsWith('guest_')) {
    guestId = 'guest_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
  }
  const token = signAppUserToken({ uid: guestId });
  res.json({
    success: true,
    user: {
      uid: guestId,
      email: null,
      displayName: 'کاربر مهمان',
      photoURL: null,
      isGuest: true,
    },
    token,
  });
});

// Knowledge Base info endpoint
apiRouter.get('/knowledge-base', (_req: Request, res: Response) => {
  const kb = loadKnowledgeBase();
  res.json({
    websiteUrl: kb.websiteUrl,
    lastSyncedAt: kb.lastSyncedAt,
    totalPages: kb.totalPages,
    pagesSummary: kb.pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.page_title,
      type: p.page_type,
      domain: p.project_domain,
      url: p.source_url,
    })),
  });
});

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Helper to authenticate and authorize admin
async function getAuthorizedAdmin(req: Request): Promise<{ uid: string; email?: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseToken(token);
  if (!user) return null;
  if (!isUserAdmin(user)) return null;
  return user;
}

// ----------------------------------------------------
// Admin Management Endpoints (Strict Server-Side Auth)
// ----------------------------------------------------

// Check if current user is an authorized admin
apiRouter.get('/admin/check', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.json({ isAdmin: false });
    return;
  }
  const token = authHeader.substring(7).trim();
  const user = await verifyFirebaseToken(token);
  if (!user) {
    res.json({ isAdmin: false });
    return;
  }
  const isAdmin = isUserAdmin(user);
  res.json({ isAdmin, uid: user.uid, email: user.email });
});

// Admin Dashboard Data: domains, assistant direction, sync report, system status, pages summary
apiRouter.get('/admin/dashboard', async (req: Request, res: Response) => {
  const admin = await getAuthorizedAdmin(req);
  if (!admin) {
    res.status(403).json({
      error: 'FORBIDDEN',
      message: 'شما اجازه دسترسی به پنل مدیریت را ندارید.',
    });
    return;
  }

  const domains = loadConfiguredDomains();
  const assistantDirection = loadAssistantDirection();
  const syncStatus = loadSyncStatus();
  const kb = loadKnowledgeBase();

  const systemStatus = {
    authentication: 'OK',
    gemini: process.env.GEMINI_API_KEY ? 'OK' : 'ERROR',
    firestore: 'OK',
    knowledgeBase: kb.totalPages > 0 ? 'OK' : 'EMPTY',
    websiteSync: syncStatus.syncStatus === 'failed' ? 'ERROR' : 'OK',
    widget: 'READY',
  };

  res.json({
    isAdmin: true,
    domains,
    assistantDirection,
    syncStatus,
    systemStatus,
    totalPages: kb.totalPages,
    indexedPages: kb.pages.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.page_title,
      type: p.page_type,
      domain: p.domain || p.project_domain,
      url: p.source_url,
      parentDomainUrl: p.parent_domain_url,
      lastModified: p.last_modified || p.last_synced_at,
      contentLength: p.content_length,
    })),
  });
});

// Add new project domain
apiRouter.post('/admin/domains', async (req: Request, res: Response) => {
  const admin = await getAuthorizedAdmin(req);
  if (!admin) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'شما اجازه دسترسی به پنل مدیریت را ندارید.' });
    return;
  }

  const { name, mainUrl, priority, active, guidanceText } = req.body || {};
  if (!name || !mainUrl) {
    res.status(400).json({ error: 'MISSING_FIELDS', message: 'نام حوزه و آدرس اصلی الزامی است.' });
    return;
  }

  const domains = loadConfiguredDomains();
  const newDomain: ProjectDomainConfig = {
    id: 'domain_' + Date.now(),
    name: String(name).trim(),
    mainUrl: String(mainUrl).trim(),
    priority: Number(priority) || (domains.length + 1),
    active: active !== false,
    guidanceText: guidanceText ? String(guidanceText).trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  domains.push(newDomain);
  saveConfiguredDomains(domains);

  res.json({ success: true, domain: newDomain, domains });
});

// Update existing project domain
apiRouter.put('/admin/domains/:id', async (req: Request, res: Response) => {
  const admin = await getAuthorizedAdmin(req);
  if (!admin) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'شما اجازه دسترسی به پنل مدیریت را ندارید.' });
    return;
  }

  const domainId = req.params.id;
  const { name, mainUrl, priority, active, guidanceText } = req.body || {};

  const domains = loadConfiguredDomains();
  const idx = domains.findIndex((d) => d.id === domainId);
  if (idx === -1) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'حوزه مورد نظر یافت نشد.' });
    return;
  }

  domains[idx] = {
    ...domains[idx],
    name: name !== undefined ? String(name).trim() : domains[idx].name,
    mainUrl: mainUrl !== undefined ? String(mainUrl).trim() : domains[idx].mainUrl,
    priority: priority !== undefined ? Number(priority) : domains[idx].priority,
    active: active !== undefined ? Boolean(active) : domains[idx].active,
    guidanceText: guidanceText !== undefined ? String(guidanceText).trim() : domains[idx].guidanceText,
    updatedAt: new Date().toISOString(),
  };

  saveConfiguredDomains(domains);
  res.json({ success: true, domain: domains[idx], domains });
});

// Delete project domain
apiRouter.delete('/admin/domains/:id', async (req: Request, res: Response) => {
  const admin = await getAuthorizedAdmin(req);
  if (!admin) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'شما اجازه دسترسی به پنل مدیریت را ندارید.' });
    return;
  }

  const domainId = req.params.id;
  let domains = loadConfiguredDomains();
  domains = domains.filter((d) => d.id !== domainId);
  saveConfiguredDomains(domains);

  res.json({ success: true, domains });
});

// Update Assistant Direction text
apiRouter.post('/admin/assistant-direction', async (req: Request, res: Response) => {
  const admin = await getAuthorizedAdmin(req);
  if (!admin) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'شما اجازه دسترسی به پنل مدیریت را ندارید.' });
    return;
  }

  const { directionText } = req.body || {};
  if (!directionText || typeof directionText !== 'string') {
    res.status(400).json({ error: 'EMPTY_TEXT', message: 'متن جهت‌دهی نمی‌تواند خالی باشد.' });
    return;
  }

  const updatedConfig = {
    directionText: directionText.trim(),
    updatedAt: new Date().toISOString(),
    updatedBy: admin.uid,
  };

  saveAssistantDirection(updatedConfig);
  res.json({ success: true, assistantDirection: updatedConfig });
});

// Reset Assistant Direction to default
apiRouter.post('/admin/assistant-direction/reset', async (req: Request, res: Response) => {
  const admin = await getAuthorizedAdmin(req);
  if (!admin) {
    res.status(403).json({ error: 'FORBIDDEN', message: 'شما اجازه دسترسی به پنل مدیریت را ندارید.' });
    return;
  }

  const resetConfig = {
    directionText: DEFAULT_ASSISTANT_DIRECTION,
    updatedAt: new Date().toISOString(),
    updatedBy: admin.uid,
  };

  saveAssistantDirection(resetConfig);
  res.json({ success: true, assistantDirection: resetConfig });
});

// Admin-only Website Sync Endpoint (Normal or Full Rebuild)
apiRouter.post('/admin/sync', async (req: Request, res: Response) => {
  try {
    const admin = await getAuthorizedAdmin(req);
    if (!admin) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'شما اجازه دسترسی به پنل مدیریت را ندارید.',
      });
      return;
    }

    const isFullRebuild = Boolean(req.body?.isFullRebuild);
    const report = await synchronizeWebsiteKnowledge({
      isFullRebuild,
      requesterUid: admin.uid,
    });

    res.json(report);
  } catch (err: any) {
    console.error('Sync error:', err);
    res.status(500).json({ error: 'SYNC_FAILED', message: 'همگام‌سازی سایت با خطا مواجه شد.' });
  }
});

// Public Webhook for WordPress auto-update (triggered on post/page publish)
apiRouter.all('/webhook/sync', async (req: Request, res: Response) => {
  const querySecret = req.query.secret as string | undefined;
  const headerSecret = (req.headers['x-sync-secret'] || req.headers['authorization']) as string | undefined;
  const expectedSecret = process.env.SYNC_SECRET || 'yazd_sync_secret';

  // Check if secret matches or if requester is admin
  const isAuthorized = querySecret === expectedSecret || headerSecret === expectedSecret || headerSecret === `Bearer ${expectedSecret}`;
  if (!isAuthorized) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'کلید وب‌هوک نامعتبر است. پارامتر ?secret=yazd_sync_secret را ارسال فرمایید.',
    });
    return;
  }

  // Trigger non-blocking background sync so WordPress request does not time out
  synchronizeWebsiteKnowledge({ isFullRebuild: false })
    .then((report) => {
      console.log(`[Webhook Sync] Auto-sync finished successfully. Total pages: ${report.totalDiscoveredPages}, Changed: ${report.changedPagesCount}`);
    })
    .catch((err: any) => {
      console.warn('[Webhook Sync] Auto-sync error:', err?.message || err);
    });

  res.json({
    success: true,
    message: 'درخواست همگام‌سازی دریافت شد و ربات در حال به‌روزرسانی اطلاعات از سایت است.',
    timestamp: new Date().toISOString(),
  });
});

// Resume text / PDF parsing endpoint
apiRouter.post('/resume-parse', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'AUTHENTICATION_REQUIRED' });
      return;
    }
    const token = authHeader.substring(7).trim();
    const user = await verifyFirebaseToken(token);
    if (!user) {
      res.status(401).json({ error: 'INVALID_TOKEN' });
      return;
    }

    const { rawText, base64Pdf } = req.body || {};
    let extractedText = rawText || '';

    if (base64Pdf) {
      try {
        const buffer = Buffer.from(base64Pdf, 'base64');
        const parser = new (PDFParse as any)(buffer);
        const textResult = await parser.getText();
        extractedText = typeof textResult === 'string' ? textResult : (textResult as any)?.text || '';
        if (typeof parser.destroy === 'function') parser.destroy();
      } catch (pdfErr) {
        console.warn('PDF parsing error:', pdfErr);
      }
    }

    if (!extractedText.trim()) {
      res.status(400).json({ error: 'EMPTY_RESUME', message: 'متنی از رزومه دریافت نشد.' });
      return;
    }

    res.json({
      success: true,
      extractedText: extractedText.substring(0, 3000),
    });
  } catch (err: any) {
    console.error('Resume parse error:', err);
    res.status(500).json({ error: 'PARSE_FAILED' });
  }
});

// Streaming Chat & Project Advisory Endpoint
apiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    // 1. Authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'برای ارسال سؤال، ابتدا باید با حساب کاربری Google خود وارد شوید.',
      });
      return;
    }

    const token = authHeader.substring(7).trim();
    const authenticatedUser = await verifyFirebaseToken(token);
    if (!authenticatedUser) {
      res.status(401).json({
        error: 'SESSION_EXPIRED',
        message: 'نشست کاربری شما منقضی یا نامعتبر شده است. لطفاً مجدداً وارد شوید.',
      });
      return;
    }

    // 2. Rate Limiting Check
    const rateLimit = checkRateLimit(authenticatedUser.uid, 25, 60 * 1000);
    if (!rateLimit.allowed) {
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ${rateLimit.retryAfterSeconds} ثانیه دیگر امتحان کنید.`,
        retryAfter: rateLimit.retryAfterSeconds,
      });
      return;
    }

    // 3. Request Body Validation
    const { question, currentPageUrl, chatHistory, candidateProfile } = req.body || {};
    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({
        error: 'EMPTY_QUESTION',
        message: 'متن سؤال نمی‌تواند خالی باشد.',
      });
      return;
    }

    if (question.trim().length > 2000) {
      res.status(400).json({
        error: 'QUESTION_TOO_LONG',
        message: 'طول پیام بیش از حد مجاز است.',
      });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'SERVER_MISCONFIGURED',
        message: 'کلید دسترسی سرویس هوش مصنوعی در سرور تنظیم نشده است.',
      });
      return;
    }

    // 4. Setup SSE (Server-Sent Events) Stream
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    try {
      const result = await streamProjectAdvisor({
        userQuestion: question.trim(),
        currentPageUrl,
        chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
        candidateProfile: candidateProfile || undefined,
        onChunk: (chunk: string) => {
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        },
        onSources: (citations) => {
          res.write(`data: ${JSON.stringify({ sources: citations })}\n\n`);
        },
      });

      // Send structured output: project cards and updated candidate profile
      if (result.projectCards && result.projectCards.length > 0) {
        res.write(`data: ${JSON.stringify({ projectCards: result.projectCards })}\n\n`);
      }

      if (result.candidateProfile) {
        res.write(`data: ${JSON.stringify({ candidateProfile: result.candidateProfile })}\n\n`);
      }

      // Signal completion
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamErr: any) {
      console.error('Advisor streaming error:', streamErr);
      res.write(
        `data: ${JSON.stringify({
          error: 'خطایی در تولید پاسخ مشاور هوشمند رخ داد. لطفاً لحظاتی دیگر مجدداً تلاش کنید.',
        })}\n\n`
      );
      res.end();
    }
  } catch (error: any) {
    console.error('Unhandled apiRouter error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'خطای غیرمنتظره‌ای در سرور رخ داد.',
      });
    } else {
      res.end();
    }
  }
});

// Embeddable JavaScript Loader for WordPress
apiRouter.get('/widget.js', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const jsCode = `
(function() {
  if (window.__yazd_growth_assistant_loaded) return;
  window.__yazd_growth_assistant_loaded = true;

  console.log('Loading Yazd Growth Center AI Assistant Widget...');
  var container = document.createElement('div');
  container.id = 'yazd-assistant-embed-root';
  document.body.appendChild(container);

  var iframe = document.createElement('iframe');
  iframe.src = '${baseUrl}/?embed=true&parentUrl=' + encodeURIComponent(window.location.href);
  iframe.style.position = 'fixed';
  iframe.style.bottom = '20px';
  iframe.style.right = '20px';
  iframe.style.width = '70px';
  iframe.style.height = '70px';
  iframe.style.border = 'none';
  iframe.style.zIndex = '999999';
  iframe.style.transition = 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
  iframe.allow = 'clipboard-write';
  container.appendChild(iframe);

  window.addEventListener('message', function(e) {
    if (e.data && e.data.type === 'GROWTH_ASSISTANT_RESIZE') {
      if (e.data.isOpen) {
        if (window.innerWidth < 640) {
          iframe.style.width = '100vw';
          iframe.style.height = '65vh';
          iframe.style.bottom = '0px';
          iframe.style.right = '0px';
        } else {
          iframe.style.width = '440px';
          iframe.style.height = '100vh';
          iframe.style.bottom = '0px';
          iframe.style.right = '0px';
        }
      } else {
        iframe.style.width = '70px';
        iframe.style.height = '70px';
        iframe.style.bottom = '20px';
        iframe.style.right = '20px';
      }
    }
  });
})();
  `.trim();

  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.send(jsCode);
});
