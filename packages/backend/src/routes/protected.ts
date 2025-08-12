import { Router, Request, Response } from 'express';
import { authRequired, authOptional } from '../middleware/auth';

const router: Router = Router();

/**
 * Protected route that requires authentication
 * GET /protected/me
 */
router.get('/me', authRequired, (req: Request, res: Response) => {
  res.json({
    authUserId: req.authUserId,
    authEmail: req.authEmail,
    userId: req.userId,
    userRole: req.userRole,
  });
});

/**
 * Optional auth route - works for both authenticated and guest users
 * GET /protected/me-optional
 */
router.get('/me-optional', authOptional, (req: Request, res: Response) => {
  res.json({
    authUserId: req.authUserId || null,
    authEmail: req.authEmail || null,
    userId: req.userId || null,
    userRole: req.userRole || null,
    authenticated: !!req.authUserId,
  });
});

export default router;
