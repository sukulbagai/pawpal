import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/auth';
import { rateLimiters } from '../middleware/ratelimit';
import { createReport } from '../lib/moderation';

const router: Router = Router();

// Validation schema for report creation
const CreateReportSchema = z.object({
  target_type: z.enum(['dog']),
  target_id: z.string().uuid(),
  category: z.enum(['abuse', 'spam', 'wrong-info', 'duplicate', 'other']),
  message: z.string().max(500).optional(),
  evidence_url: z.string().url().optional(),
});

/**
 * GET /reports
 * Get reports - test endpoint
 */
router.get('/', 
  authRequired,
  async (_req, res): Promise<void> => {
    res.json({
      ok: true,
      message: 'Reports endpoint is working'
    });
  }
);

/**
 * POST /reports
 * Create a new report
 */
router.post('/', 
  authRequired,
  rateLimiters.reports,
  async (req, res): Promise<void> => {
    try {
      // Validate request body
      const validatedData = CreateReportSchema.parse(req.body);

      // Create the report
      const report = await createReport({
        targetType: validatedData.target_type,
        targetId: validatedData.target_id,
        reporterAuthUserId: req.authUserId!,
        category: validatedData.category,
        message: validatedData.message,
        evidenceUrl: validatedData.evidence_url,
      });

      res.status(201).json({
        ok: true,
        report
      });
    } catch (error) {
      console.error('Error creating report:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          ok: false,
          error: {
            message: 'Validation error',
            details: error.issues
          }
        });
        return;
      }

      if (error instanceof Error && error.message.includes('Reporter not found')) {
        res.status(404).json({
          ok: false,
          error: { message: 'User not found' }
        });
        return;
      }

      res.status(500).json({
        ok: false,
        error: { message: 'Failed to create report' }
      });
    }
  }
);

export { router as reportsRouter };
