import { Router, Request, Response, NextFunction } from 'express';
import { validateBody, grammarSchema } from '../middleware/validator.js';
import { providerManager } from '../providers/manager.js';

const router = Router();

router.post(
  '/grammar',
  validateBody(grammarSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { text, requestId = `req-${Date.now()}` } = req.body;

    try {
      const generated = await providerManager.execute({
        task: 'grammar',
        text,
      });

      res.json({
        requestId,
        task: 'grammar',
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
