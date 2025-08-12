import { Router } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router: Router = Router();

// GET /tags/personality - Get all personality tags
router.get('/personality', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('personality_tags')
      .select('id, tag_name')
      .order('tag_name');

    if (error) {
      console.error('Error fetching personality tags:', error);
      return res.status(500).json({
        error: 'Failed to fetch personality tags'
      });
    }

    return res.json(data || []);
  } catch (error) {
    return next(error);
  }
});

export default router;
