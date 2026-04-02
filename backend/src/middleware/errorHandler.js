import { logger } from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    path: req.originalUrl,
    method: req.method,
    err: err?.message,
    stack: err?.stack
  });
  res.status(500).json({ error: 'INTERNAL_ERROR' });
  next();
}

