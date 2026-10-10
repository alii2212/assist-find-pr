import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/apiRouter.ts';
import { synchronizeWebsiteKnowledge } from './src/server/crawlerService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Parse JSON bodies
  app.use(express.json({ limit: '15mb' }));

  // Embedding & CSP security headers
  app.use((_req, res, next) => {
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://yazdinnofaraz.ir https://www.yazdinnofaraz.ir https://*.run.app https://*.onrender.com;"
    );
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.removeHeader('X-Frame-Options');
    next();
  });

  // Fast health ping endpoints for uptime monitors, cron jobs & keep-alive
  app.get(['/health', '/ping'], (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api', apiRouter);

  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    // Serve static frontend build
    console.log('Serving production static build from dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Dev mode: Mount Vite middlewares
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        allowedHosts: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);

    // Automatic background sync every 12 hours from yazdinnofaraz.ir
    const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
    setInterval(() => {
      console.log('[Auto-Sync] Running scheduled background sync with yazdinnofaraz.ir...');
      synchronizeWebsiteKnowledge({ isFullRebuild: false }).catch((err: any) => {
        console.warn('[Auto-Sync] Background sync encountered an issue:', err?.message || err);
      });
    }, TWELVE_HOURS_MS);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
