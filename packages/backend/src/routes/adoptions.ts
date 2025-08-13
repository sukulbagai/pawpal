import { Router, Request, Response, NextFunction } from 'express';
import { authRequired } from '../middleware/auth';
import { AdoptionCreateSchema, AdoptionStatusUpdateSchema } from '../lib/validators';
import {
  createAdoptionRequest,
  listIncomingRequests,
  listOutgoingRequests,
  updateAdoptionStatus,
} from '../lib/adoptions';

export const adoptionsRouter: Router = Router();

// POST /adoptions - Create a new adoption request
adoptionsRouter.post('/', authRequired, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validatedData = AdoptionCreateSchema.parse(req.body);
    
    const newRequest = await createAdoptionRequest({
      dogId: validatedData.dog_id,
      adopterAuthUserId: req.authUserId!,
      message: validatedData.message,
    });

    res.status(201).json({
      ok: true,
      request: newRequest,
    });
  } catch (error: any) {
    if (error.message === 'You already have a pending request for this dog') {
      res.status(409).json({
        ok: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});

// GET /adoptions/incoming - List incoming requests for dog owner
adoptionsRouter.get('/incoming', authRequired, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await listIncomingRequests({
      ownerAuthUserId: req.authUserId!,
    });

    res.json({
      ok: true,
      items: requests,
    });
  } catch (error) {
    next(error);
  }
});

// GET /adoptions/outgoing - List outgoing requests for adopter
adoptionsRouter.get('/outgoing', authRequired, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requests = await listOutgoingRequests({
      adopterAuthUserId: req.authUserId!,
    });

    res.json({
      ok: true,
      items: requests,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /adoptions/:id - Update adoption request status
adoptionsRouter.patch('/:id', authRequired, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const requestId = req.params.id;
    console.log('Updating adoption request:', requestId);
    console.log('Request body:', req.body);
    console.log('Auth user ID:', req.authUserId);
    
    const validatedData = AdoptionStatusUpdateSchema.parse(req.body);
    console.log('Validated data:', validatedData);

    const result = await updateAdoptionStatus({
      requestId,
      ownerAuthUserId: req.authUserId!,
      status: validatedData.status,
    });

    console.log('Update result:', result);

    res.json({
      ok: true,
      request: result.request,
      dog: result.dog,
    });
  } catch (error: any) {
    console.error('Error in PATCH /adoptions/:id:', error);
    if (error.message.includes('Unauthorized')) {
      res.status(403).json({
        ok: false,
        error: error.message,
      });
      return;
    }
    next(error);
  }
});
