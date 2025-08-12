import { Request, Response, NextFunction } from 'express';

/**
 * Custom error interface
 */
interface CustomError extends Error {
  status?: number;
  code?: string;
}

/**
 * Central error handler middleware
 * Logs errors and sends consistent error responses
 */
export function errorHandler(
  err: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response | void {
  // Log error details (but don't leak sensitive info)
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Determine status code
  const status = err.status || 500;
  
  // Determine error code
  const code = err.code || 'INTERNAL_ERROR';

  // Send error response (don't leak internal details in production)
  const message = status < 500 || process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'An internal error occurred';

  return res.status(status).json({
    error: {
      message,
      code,
    },
  });
}

/**
 * 404 handler for unknown routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): Response => {
  return res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
}
