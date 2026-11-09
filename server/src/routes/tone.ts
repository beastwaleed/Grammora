import { Router, Request, Response, NextFunction } from 'express';
import { validateBody, toneSchema } from '../middleware/validator.js';
import { providerManager } from '../providers/manager.js';

const router = Router();

router.post(
  '/tone',
  validateBody(toneSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { text, mode, requestId = `req-${Date.now()}` } = req.body;

    try {
      const generated = await providerManager.execute({
        task: 'tone',
        text,
        mode,
      });

      res.json({
        requestId,
        task: 'tone',
        mode,
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

