import { Router } from 'express';
import { listDogs, getDogById, createDog, Viewer } from '../lib/dogs';
import { getMyRequestForDog } from '../lib/adoptions';
import { DogListQuerySchema, DogCreateSchema } from '../lib/validators';
import { authRequired, authOptional } from '../middleware/auth';
import { rateLimiters } from '../middleware/ratelimit';
import { supabaseAdmin } from '../lib/supabase';

const router: Router = Router();

/**
 * Helper function to build viewer context from request
 */
async function buildViewer(req: any): Promise<Viewer | undefined> {
  if (!req.authUserId) {
    return undefined;
  }

  // Look up user details
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('auth_user_id', req.authUserId)
    .single();

  if (error || !user) {
    return { authUserId: req.authUserId };
  }

  return {
    authUserId: req.authUserId,
    userId: user.id,
    isAdmin: user.role === 'admin',
  };
}

// GET /dogs - List dogs with filtering
router.get('/', authOptional, async (req, res, next) => {
  try {
    const queryResult = DogListQuerySchema.safeParse(req.query);
    
    if (!queryResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryResult.error.issues
      });
    }

    // Build viewer context
    const viewer = await buildViewer(req);

    const { items, total } = await listDogs(queryResult.data, viewer);
    
    return res.json({
      items,
      page: {
        limit: queryResult.data.limit || 24,
        offset: queryResult.data.offset || 0,
        total
      }
    });
  } catch (error) {
    return next(error);
  }
});

// GET /dogs/:id - Get specific dog
router.get('/:id', authOptional, async (req, res, next) => {
  try {
    const dogId = req.params.id;
    
    if (!dogId) {
      return res.status(400).json({
        error: 'Invalid dog ID'
      });
    }

    // Build viewer context
    const viewer = await buildViewer(req);

    const dog = await getDogById(dogId, viewer);
    
    if (!dog) {
      return res.status(404).json({
        error: 'Dog not found'
      });
    }

    return res.json(dog);
  } catch (error) {
    return next(error);
  }
});

// GET /dogs/:id/my-request - Get current user's adoption request for a specific dog
router.get('/:id/my-request', authRequired, async (req, res, next) => {
  try {
    const dogId = req.params.id;
    
    if (!dogId) {
      return res.status(400).json({
        error: 'Invalid dog ID'
      });
    }

    if (!req.authUserId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const request = await getMyRequestForDog({
      dogId,
      userAuthUserId: req.authUserId
    });

    return res.json({ request });
  } catch (error) {
    return next(error);
  }
});

// POST /dogs - Create new dog (requires authentication)
router.post('/', authRequired, rateLimiters.dogCreation, async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Validate request body
    const validationResult = DogCreateSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid dog data',
        details: validationResult.error.issues
      });
    }

    // Create the dog
    const dog = await createDog({
      data: validationResult.data,
      ownerUserId: req.userId
    });

    return res.status(201).json(dog);
  } catch (error) {
    return next(error);
  }
});

export default router;
