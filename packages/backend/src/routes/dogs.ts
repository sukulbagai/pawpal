import { Router } from 'express';
import { listDogs, getDogById, createDog } from '../lib/dogs';
import { DogListQuerySchema, DogCreateSchema } from '../lib/validators';
import { authRequired } from '../middleware/auth';

const router: Router = Router();

// GET /dogs - List dogs with filtering
router.get('/', async (req, res, next) => {
  try {
    const queryResult = DogListQuerySchema.safeParse(req.query);
    
    if (!queryResult.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: queryResult.error.issues
      });
    }

    const { dogs, total } = await listDogs(queryResult.data);
    
    return res.json({
      dogs,
      pagination: {
        total,
        limit: queryResult.data.limit || 20,
        offset: queryResult.data.offset || 0
      }
    });
  } catch (error) {
    return next(error);
  }
});

// GET /dogs/:id - Get specific dog
router.get('/:id', async (req, res, next) => {
  try {
    const dogId = parseInt(req.params.id, 10);
    
    if (isNaN(dogId)) {
      return res.status(400).json({
        error: 'Invalid dog ID'
      });
    }

    const dog = await getDogById(dogId);
    
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

// POST /dogs - Create new dog (requires authentication)
router.post('/', authRequired, async (req, res, next) => {
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
