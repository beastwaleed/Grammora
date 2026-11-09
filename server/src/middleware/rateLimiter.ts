import rateLimit from 'express-rate-limit';

const maxRequests = Number(process.env.MAX_REQUESTS_PER_MINUTE) || 60;

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      requestId: req.body?.requestId || `rate-${Date.now()}`,
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'Rate limit exceeded. Please wait a moment before sending more requests.',
      },
    });
  },
});
