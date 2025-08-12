import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { getUserByAuthId } from '../lib/users';

/**
 * Extract Bearer token from Authorization header
 */
function extractBearer(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove 'Bearer ' prefix
}

/**
 * Optional authentication middleware
 * If token is present and valid, attaches user info to req
 * If token is missing or invalid, continues as guest (no error)
 */
export async function authOptional(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearer(req);
    
    if (!token) {
      // No token provided - continue as guest
      return next();
    }

    // Validate token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      // Invalid token - continue as guest (don't throw error)
      console.warn('Invalid token provided:', error?.message);
      return next();
    }

    // Attach Supabase auth info
    req.authUserId = user.id;
    req.authEmail = user.email || null;

    // Lookup internal user data
    const internalUser = await getUserByAuthId(user.id);
    if (internalUser) {
      req.userId = internalUser.id;
      req.userRole = internalUser.role;
    } else {
      req.userId = null;
      req.userRole = null;
    }

    next();
  } catch (error) {
    console.error('Error in authOptional middleware:', error);
    // Continue as guest on any error
    next();
  }
}

/**
 * Required authentication middleware
 * Validates token and throws 401 if missing or invalid
 */
export async function authRequired(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const token = extractBearer(req);
    
    if (!token) {
      return res.status(401).json({
        error: {
          message: 'Authorization token required',
          code: 'MISSING_TOKEN'
        }
      });
    }

    // Validate token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: {
          message: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        }
      });
    }

    // Attach Supabase auth info
    req.authUserId = user.id;
    req.authEmail = user.email || null;

    // Lookup internal user data
    const internalUser = await getUserByAuthId(user.id);
    if (internalUser) {
      req.userId = internalUser.id;
      req.userRole = internalUser.role;
    } else {
      req.userId = null;
      req.userRole = null;
    }

    next();
  } catch (error) {
    console.error('Error in authRequired middleware:', error);
    return res.status(500).json({
      error: {
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      }
    });
  }
}
