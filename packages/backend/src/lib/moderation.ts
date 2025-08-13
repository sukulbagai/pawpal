import { supabaseAdmin } from './supabase';

export interface CreateReportParams {
  targetType: 'dog';
  targetId: string;
  reporterAuthUserId: string;
  category: 'abuse' | 'spam' | 'wrong-info' | 'duplicate' | 'other';
  message?: string;
  evidenceUrl?: string;
}

export interface ListReportsParams {
  status?: 'open' | 'actioned' | 'dismissed';
  limit?: number;
  offset?: number;
}

export interface ActionReportParams {
  reportId: string;
  actorAuthUserId: string;
  action: 'hide-dog' | 'unhide-dog' | 'soft-delete-dog' | 'override-status' | 'dismiss';
  notes?: string;
  meta?: Record<string, any>;
}

export interface Report {
  id: string;
  target_type: string;
  target_id: string;
  category: string;
  message: string | null;
  evidence_url: string | null;
  status: 'open' | 'actioned' | 'dismissed';
  created_at: string;
  updated_at: string;
  dog?: {
    id: string;
    name: string;
    area: string;
    images: string[];
    status: string;
  };
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ModerationAction {
  id: string;
  report_id: string | null;
  action: string;
  notes: string | null;
  meta: Record<string, any>;
  created_at: string;
  actor?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Create a new report
 */
export async function createReport(params: CreateReportParams): Promise<Report> {
  // First resolve the reporter's user ID
  const { data: reporter, error: reporterError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_user_id', params.reporterAuthUserId)
    .single();

  if (reporterError || !reporter) {
    throw new Error('Reporter not found');
  }

  // Create the report
  const { data: report, error } = await supabaseAdmin
    .from('reports')
    .insert({
      target_type: params.targetType,
      target_id: params.targetId,
      reporter_id: reporter.id,
      category: params.category,
      message: params.message || null,
      evidence_url: params.evidenceUrl || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
  }

  return report;
}

/**
 * List reports with optional filtering
 */
export async function listReports(params: ListReportsParams = {}): Promise<{
  items: Report[];
  total: number;
}> {
  const { status, limit = 50, offset = 0 } = params;

  // First, get the reports without joins
  let query = supabaseAdmin
    .from('reports')
    .select('*', { count: 'exact' });

  if (status) {
    query = query.eq('status', status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: reports, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list reports: ${error.message}`);
  }

  if (!reports || reports.length === 0) {
    return {
      items: [],
      total: count || 0,
    };
  }

  // Get unique dog IDs and reporter IDs for batch fetching
  const dogIds = [...new Set(reports.map(r => r.target_id))];
  const reporterIds = [...new Set(reports.filter(r => r.reporter_id).map(r => r.reporter_id))];

  // Fetch dogs data
  const { data: dogs } = await supabaseAdmin
    .from('dogs')
    .select('id, name, area, images, status')
    .in('id', dogIds);

  // Fetch reporter data
  const { data: reporters } = await supabaseAdmin
    .from('users')
    .select('id, name, email')
    .in('id', reporterIds);

  // Create lookup maps
  const dogMap = new Map(dogs?.map(dog => [dog.id, dog]) || []);
  const reporterMap = new Map(reporters?.map(user => [user.id, user]) || []);

  // Combine the data
  const enrichedReports = reports.map(report => ({
    ...report,
    dog: dogMap.get(report.target_id) || null,
    reporter: report.reporter_id ? reporterMap.get(report.reporter_id) || null : null,
  }));

  return {
    items: enrichedReports,
    total: count || 0,
  };
}

/**
 * Take action on a report
 */
export async function actionReport(params: ActionReportParams): Promise<{
  report: Report;
  action: ModerationAction;
}> {
  // First resolve the actor's user ID
  const { data: actor, error: actorError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('auth_user_id', params.actorAuthUserId)
    .single();

  if (actorError || !actor) {
    throw new Error('Actor not found');
  }

  if (actor.role !== 'admin') {
    throw new Error('Only admins can action reports');
  }

  // Get the report to find the target
  const { data: report, error: reportError } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('id', params.reportId)
    .single();

  if (reportError || !report) {
    throw new Error('Report not found');
  }

  // Perform the action based on type
  if (params.action === 'hide-dog') {
    await hideDog(report.target_id);
  } else if (params.action === 'unhide-dog') {
    await unhideDog(report.target_id);
  } else if (params.action === 'soft-delete-dog') {
    await softDeleteDog(report.target_id);
  } else if (params.action === 'override-status') {
    if (!params.meta?.status) {
      throw new Error('Status is required for override-status action');
    }
    await overrideDogStatus(report.target_id, params.meta.status);
  }

  // Log the moderation action
  const { data: moderationAction, error: actionError } = await supabaseAdmin
    .from('moderation_actions')
    .insert({
      report_id: params.reportId,
      actor_user_id: actor.id,
      action: params.action,
      notes: params.notes || null,
      meta: params.meta || {},
    })
    .select()
    .single();

  if (actionError) {
    throw new Error(`Failed to log moderation action: ${actionError.message}`);
  }

  // Update report status
  const newReportStatus = params.action === 'dismiss' ? 'dismissed' : 'actioned';
  const { data: updatedReport, error: updateError } = await supabaseAdmin
    .from('reports')
    .update({ status: newReportStatus })
    .eq('id', params.reportId)
    .select()
    .single();

  if (updateError) {
    throw new Error(`Failed to update report status: ${updateError.message}`);
  }

  return {
    report: updatedReport,
    action: moderationAction,
  };
}

/**
 * Hide a dog
 */
export async function hideDog(dogId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('dogs')
    .update({ is_hidden: true })
    .eq('id', dogId);

  if (error) {
    throw new Error(`Failed to hide dog: ${error.message}`);
  }
}

/**
 * Unhide a dog
 */
export async function unhideDog(dogId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('dogs')
    .update({ is_hidden: false })
    .eq('id', dogId);

  if (error) {
    throw new Error(`Failed to unhide dog: ${error.message}`);
  }
}

/**
 * Soft delete a dog
 */
export async function softDeleteDog(dogId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('dogs')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', dogId);

  if (error) {
    throw new Error(`Failed to soft delete dog: ${error.message}`);
  }
}

/**
 * Override dog adoption status
 */
export async function overrideDogStatus(
  dogId: string,
  status: 'available' | 'pending' | 'adopted'
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('dogs')
    .update({ status })
    .eq('id', dogId);

  if (error) {
    throw new Error(`Failed to override dog status: ${error.message}`);
  }
}
