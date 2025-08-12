import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * Health check endpoint
 * GET /health
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    service: 'pawpal-api',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default router;
