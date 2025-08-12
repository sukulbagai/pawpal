import { Router, Request, Response } from 'express';
import { authRequired } from '../middleware/auth';
import { ensureUserByAuth } from '../lib/users';
import { supabaseAdmin } from '../lib/supabase';

const router: Router = Router();

/**
 * Bootstrap user endpoint - creates public.users row on first login
 * POST /auth/bootstrap-user
 */
router.post('/bootstrap-user', authRequired, async (req: Request, res: Response): Promise<Response> => {
  try {
    const authUserId = req.authUserId!; // authRequired ensures this exists
    const authEmail = req.authEmail;

    // Get additional user info from Supabase Auth if available
    let userName: string | null = null;
    try {
      const token = req.headers.authorization?.substring(7); // Remove 'Bearer '
      if (token) {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        userName = user?.user_metadata?.name || user?.user_metadata?.full_name || null;
      }
    } catch (error) {
      console.warn('Could not fetch user metadata:', error);
    }

    // Ensure user exists in our database
    const user = await ensureUserByAuth(authUserId, {
      name: userName,
      email: authEmail,
      role: 'adopter', // Default role
    });

    if (!user) {
      return res.status(500).json({
        error: {
          message: 'Failed to create or retrieve user',
          code: 'BOOTSTRAP_FAILED'
        }
      });
    }

    return res.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error in bootstrap-user:', error);
    return res.status(500).json({
      error: {
        message: 'Bootstrap failed',
        code: 'BOOTSTRAP_ERROR'
      }
    });
  }
});

export default router;
