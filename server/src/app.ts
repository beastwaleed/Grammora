import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health.js';
import grammarRouter from './routes/grammar.js';
import rewriteRouter from './routes/rewrite.js';
import toneRouter from './routes/tone.js';
import autocompleteRouter from './routes/autocomplete.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';

import path from 'path';
import fs from 'fs';

// Look for server/.env or root .env
const serverEnvPath = path.resolve(process.cwd(), 'server/.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config();
}

export function createApp(): Express {
  const app = express();

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow chrome-extension:// origins, localhost, or no-origin (curl/tests)
        if (!origin || origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(null, true); // Dev-friendly permissive CORS
        }
      },
      credentials: true,
    })
  );

  // Body parser with size limits
  app.use(express.json({ limit: '1mb' }));

  // Global rate limiter
  app.use('/api', apiRateLimiter);

  // Health check route
  app.use('/api', healthRouter);

  // Core task routes
  app.use('/api', grammarRouter);
  app.use('/api', rewriteRouter);
  app.use('/api', toneRouter);
  app.use('/api', autocompleteRouter);

  // Central error handler
  app.use(errorHandler);

  return app;
}

