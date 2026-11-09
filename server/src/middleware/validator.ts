import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

const MAX_TEXT_LENGTH = Number(process.env.MAX_INPUT_CHARACTERS) || 4000;

export const grammarSchema = z.object({
  text: z.string().trim().min(1, 'Text cannot be empty').max(MAX_TEXT_LENGTH, `Text exceeds ${MAX_TEXT_LENGTH} character limit`),
  requestId: z.string().optional(),
});

export const rewriteSchema = z.object({
  text: z.string().trim().min(1, 'Text cannot be empty').max(MAX_TEXT_LENGTH, `Text exceeds ${MAX_TEXT_LENGTH} character limit`),
  requestId: z.string().optional(),
});

export const toneSchema = z.object({
  text: z.string().trim().min(1, 'Text cannot be empty').max(MAX_TEXT_LENGTH, `Text exceeds ${MAX_TEXT_LENGTH} character limit`),
  mode: z.enum(['professional', 'friendly', 'concise']).default('professional'),
  requestId: z.string().optional(),
});

export const autocompleteSchema = z.object({
  text: z.string().trim().min(1, 'Context text cannot be empty').max(1000, 'Context text exceeds 1000 character limit'),
  completionLength: z.enum(['short', 'medium']).default('short'),
  requestId: z.string().optional(),
});

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issue = result.error.issues[0];
      res.status(400).json({
        requestId: req.body?.requestId || `err-${Date.now()}`,
        error: {
          code: 'INVALID_INPUT',
          message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'Invalid request payload',
        },
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

