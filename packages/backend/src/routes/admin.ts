import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth';
import { adminRequired } from '../middleware/admin';
import { listReports, actionReport } from '../lib/moderation';
import { listDogs, hideDog, unhideDog, softDeleteDog, overrideDogStatus } from '../lib/dogs';

const router: Router = Router();

// Apply auth and admin middleware to all routes
router.use(authRequired);
router.use(adminRequired);

// Validation schemas
const ListReportsSchema = z.object({
  status: z.enum(['open', 'actioned', 'dismissed']).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

const ActionReportSchema = z.object({
  action: z.enum(['hide-dog', 'unhide-dog', 'soft-delete-dog', 'override-status', 'dismiss']),
  notes: z.string().max(500).optional(),
  meta: z.record(z.string(), z.any()).optional(),
});

const ListDogsSchema = z.object({
  includeHidden: z.coerce.boolean().default(false),
  includeDeleted: z.coerce.boolean().default(false),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
});

const VisibilityOpSchema = z.object({
  op: z.enum(['hide', 'unhide', 'soft-delete']),
});

const StatusOverrideSchema = z.object({
  status: z.enum(['available', 'pending', 'adopted']),
});

/**
 * GET /admin/reports
 * List all reports with filtering
 */
router.get('/reports', async (req, res): Promise<void> => {
  try {
    const { status, limit, offset } = ListReportsSchema.parse(req.query);

    const result = await listReports({ status, limit, offset });

    res.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error('Error listing reports:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: {
          message: 'Validation error',
          details: error.issues,
        },
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: { message: 'Failed to list reports' },
    });
  }
});

/**
 * PATCH /admin/reports/:id
 * Take action on a report
 */
router.patch('/reports/:id', async (req, res): Promise<void> => {
  try {
    const reportId = req.params.id;
    const { action, notes, meta } = ActionReportSchema.parse(req.body);

    // Validate that override-status has required meta.status
    if (action === 'override-status' && !meta?.status) {
      res.status(400).json({
        ok: false,
        error: { message: 'Status is required for override-status action' },
      });
      return;
    }

    const result = await actionReport({
      reportId,
      actorAuthUserId: req.authUserId!,
      action,
      notes,
      meta,
    });

    res.json({
      ok: true,
      report: result.report,
      action: result.action,
    });
  } catch (error) {
    console.error('Error actioning report:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: {
          message: 'Validation error',
          details: error.issues,
        },
      });
      return;
    }

    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        ok: false,
        error: { message: error.message },
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: { message: 'Failed to action report' },
    });
  }
});

/**
 * GET /admin/dogs
 * List all dogs including hidden/deleted
 */
router.get('/dogs', async (req, res): Promise<void> => {
  try {
    const { includeHidden, includeDeleted, limit, offset, q } = ListDogsSchema.parse(req.query);

    // Admin can see everything
    const viewer = { isAdmin: true };
    const result = await listDogs({ limit, offset, q }, viewer);

    // Filter based on include flags if needed
    let items = result.items;
    if (!includeHidden) {
      items = items.filter(dog => !dog.is_hidden);
    }
    if (!includeDeleted) {
      items = items.filter(dog => !dog.deleted_at);
    }

    res.json({
      ok: true,
      items,
      total: items.length,
      page: {
        limit,
        offset,
        total: items.length,
      },
    });
  } catch (error) {
    console.error('Error listing dogs for admin:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: {
          message: 'Validation error',
          details: error.issues,
        },
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: { message: 'Failed to list dogs' },
    });
  }
});

/**
 * PATCH /admin/dogs/:id/visibility
 * Change dog visibility (hide/unhide/soft-delete)
 */
router.patch('/dogs/:id/visibility', async (req, res): Promise<void> => {
  try {
    const dogId = req.params.id;
    const { op } = VisibilityOpSchema.parse(req.body);

    switch (op) {
      case 'hide':
        await hideDog(dogId);
        break;
      case 'unhide':
        await unhideDog(dogId);
        break;
      case 'soft-delete':
        await softDeleteDog(dogId);
        break;
    }

    res.json({
      ok: true,
      message: `Dog ${op} operation completed successfully`,
    });
  } catch (error) {
    console.error('Error changing dog visibility:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: {
          message: 'Validation error',
          details: error.issues,
        },
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: { message: 'Failed to change dog visibility' },
    });
  }
});

/**
 * PATCH /admin/dogs/:id/status
 * Override dog adoption status
 */
router.patch('/dogs/:id/status', async (req, res): Promise<void> => {
  try {
    const dogId = req.params.id;
    const { status } = StatusOverrideSchema.parse(req.body);

    await overrideDogStatus(dogId, status);

    res.json({
      ok: true,
      message: 'Dog status updated successfully',
    });
  } catch (error) {
    console.error('Error overriding dog status:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({
        ok: false,
        error: {
          message: 'Validation error',
          details: error.issues,
        },
      });
      return;
    }

    res.status(500).json({
      ok: false,
      error: { message: 'Failed to override dog status' },
    });
  }
});

export { router as adminRouter };
