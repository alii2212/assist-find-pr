import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { apiRouter } from './src/server/apiRouter.ts';

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
    res.removeHeader('X-Frame-Options');
    next();
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
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
