import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

export interface AdminRequest extends Request {
  isAdmin?: boolean;
}

/**
 * Middleware that requires admin role
 * Must be used after authRequired middleware
 */
export const adminRequired = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authUserId = req.authUserId;
    
    if (!authUserId) {
      res.status(401).json({
        ok: false,
        error: { message: 'Authentication required' }
      });
      return;
    }

    // Look up user by auth_user_id to get role
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('auth_user_id', authUserId)
      .single();

    if (error || !user) {
      res.status(401).json({
        ok: false,
        error: { message: 'User not found' }
      });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({
        ok: false,
        error: { message: 'Admin access required' }
      });
      return;
    }

    // Add admin context to request
    req.userId = user.id;
    req.userRole = user.role;
    req.isAdmin = true;

    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({
      ok: false,
      error: { message: 'Internal server error' }
    });
  }
};
