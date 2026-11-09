import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.body?.requestId || `err-${Date.now()}`;
  const code = err.code || 'PROVIDER_ERROR';
  let status = err.status || 500;

  if (code === 'INVALID_INPUT') status = 400;
  if (code === 'QUOTA_EXCEEDED') status = 429;
  if (code === 'PROVIDER_TIMEOUT') status = 504;

  console.error(`[API Error] [${requestId}] ${code}: ${err.message}`);

  res.status(status).json({
    requestId,
    error: {
      code,
      message: err.message || 'An unexpected error occurred during processing.',
    },
  });
}
