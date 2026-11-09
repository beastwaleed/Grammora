import { Router, Request, Response, NextFunction } from 'express';
import { validateBody, autocompleteSchema } from '../middleware/validator.js';
import { providerManager } from '../providers/manager.js';

const router = Router();

router.post(
  '/autocomplete',
  validateBody(autocompleteSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const { text, completionLength, requestId = `req-${Date.now()}` } = req.body;

    try {
      const generated = await providerManager.execute({
        task: 'autocomplete',
        text,
        completionLength,
      });

      res.json({
        requestId,
        task: 'autocomplete',
        completionLength,
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

