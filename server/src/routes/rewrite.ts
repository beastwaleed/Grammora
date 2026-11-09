import { Router, Request, Response, NextFunction } from 'express';
import { validateBody, rewriteSchema } from '../middleware/validator.js';
import { providerManager } from '../providers/manager.js';

const router = Router();

router.post(
  '/rewrite',
  validateBody(rewriteSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { text, requestId = `req-${Date.now()}` } = req.body;

    try {
      const generated = await providerManager.execute({
        task: 'rewrite',
        text,
      });

      res.json({
        requestId,
        task: 'rewrite',
        result: generated.result,
        provider: generated.provider,
        model: generated.model,
        latencyMs: generated.latencyMs,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

