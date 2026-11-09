import { Router, Request, Response } from 'express';
import { providerManager } from '../providers/manager.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const providerStatus = providerManager.getProviderStatus();
  res.json({
    ok: true,
    status: 'healthy',
    version: '0.1.0',
    providers: providerStatus,
    timestamp: new Date().toISOString(),
  });
});

export default router;
