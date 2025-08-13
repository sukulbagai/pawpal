# Step 9: Admin & Moderation System

This step implements a comprehensive moderation system for PawPal, including user reports, admin dashboard, content visibility controls, and abuse prevention.

## 🎯 Features Implemented

### User Reporting System
- **Report Button**: Any signed-in user can report inappropriate dogs
- **Report Categories**: Abuse, spam, wrong information, duplicate listings, other
- **Evidence Support**: Optional evidence URL for supporting documentation
- **Rate Limiting**: 10 reports per 10 minutes to prevent abuse

### Admin Dashboard
- **Reports Management**: View, triage, and action all user reports
- **Dog Moderation**: Hide/unhide, soft delete, and status override capabilities
- **Audit Trail**: All moderation actions are logged with timestamps and notes
- **Bulk Operations**: Efficient management of multiple reports and dogs

### Content Visibility System
- **Public Safety**: Hidden and deleted dogs are excluded from public listings
- **Owner Access**: Dog owners can still view their own hidden dogs
- **Admin Override**: Admins can see all content regardless of status
- **Soft Delete**: Dogs are never permanently deleted, maintaining data integrity

### Abuse Prevention
- **Rate Limiting**: Prevents spam on report submissions and dog postings
- **Token Bucket Algorithm**: In-memory rate limiting per user/IP
- **Configurable Limits**: Easy to adjust thresholds as needed

## 🗄️ Database Schema

### New Tables

#### Reports
```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY,
  target_type TEXT CHECK (target_type IN ('dog')),
  target_id UUID NOT NULL,
  reporter_id UUID REFERENCES users(id),
  category TEXT CHECK (category IN ('abuse', 'spam', 'wrong-info', 'duplicate', 'other')),
  message TEXT,
  evidence_url TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Moderation Actions
```sql
CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  actor_user_id UUID REFERENCES users(id),
  action TEXT CHECK (action IN ('hide-dog', 'unhide-dog', 'soft-delete-dog', 'override-status', 'dismiss')),
  notes TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modified Tables

#### Dogs (Added Moderation Columns)
```sql
ALTER TABLE dogs 
  ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN deleted_at TIMESTAMPTZ;
```

## 🚀 API Endpoints

### Reports API

#### POST /reports
Create a new report.
```bash
curl -X POST http://localhost:4000/reports \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_type": "dog",
    "target_id": "uuid",
    "category": "abuse",
    "message": "Inappropriate content",
    "evidence_url": "https://example.com/evidence"
  }'
```

### Admin API (Admin Role Required)

#### GET /admin/reports
List all reports with filtering.
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:4000/admin/reports?status=open&limit=50&offset=0"
```

#### PATCH /admin/reports/:id
Take action on a report.
```bash
curl -X PATCH http://localhost:4000/admin/reports/uuid \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "hide-dog",
    "notes": "Content violates community guidelines"
  }'
```

#### GET /admin/dogs
List all dogs including hidden/deleted (admin view).
```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:4000/admin/dogs?includeHidden=1&includeDeleted=1"
```

#### PATCH /admin/dogs/:id/visibility
Modify dog visibility.
```bash
curl -X PATCH http://localhost:4000/admin/dogs/uuid/visibility \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"op": "hide"}'
```

#### PATCH /admin/dogs/:id/status
Override dog adoption status.
```bash
curl -X PATCH http://localhost:4000/admin/dogs/uuid/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "adopted"}'
```

## 🎨 Frontend Components

### Admin Dashboard (`/admin`)
- **Tabbed Interface**: Reports and Dogs management
- **Data Tables**: Sortable, filterable views
- **Action Buttons**: Quick moderation actions
- **Status Pills**: Visual status indicators
- **Responsive Design**: Works on all screen sizes

### Report Button
- **Context Aware**: Only shows for non-owners
- **Inline Form**: Dropdown category selection and message input
- **Validation**: Client-side form validation
- **Toast Feedback**: Success/error notifications

### Enhanced Navbar
- **Admin Link**: Visible to admin users only
- **Role Detection**: Automatic admin role detection

## 🔐 Security Features

### Role-Based Access Control
- **Admin Middleware**: Verifies admin role before sensitive operations
- **RLS Policies**: Database-level security for all moderation tables
- **JWT Validation**: All endpoints require valid authentication

### Content Visibility Rules
1. **Public Users**: See only visible, non-deleted dogs
2. **Dog Owners**: See their own hidden dogs with status indicators
3. **Admins**: See all content with moderation controls

### Rate Limiting
- **In-Memory Store**: Fast, efficient rate limiting
- **Per-User Tracking**: Limits based on authenticated user ID
- **IP Fallback**: Rate limiting for unauthenticated users
- **Configurable**: Easy to adjust limits and windows

## 🧪 Testing Guide

### Setup Admin User
1. Create a regular account in the app
2. In Supabase dashboard, go to Table Editor → public.users
3. Find your user and change `role` from 'adopter' to 'admin'

### Test Report Flow
1. **As Regular User**:
   - Navigate to any dog detail page
   - Click "Report" button
   - Fill out form and submit
   - Verify success toast

2. **As Admin**:
   - Navigate to `/admin`
   - Go to Reports tab
   - Find the report and take action (Hide dog)
   - Verify dog disappears from public listings

### Test Visibility Rules
1. **Public View**: Hidden dogs don't appear in listings
2. **Owner View**: Hidden dogs appear with "Hidden" indicator
3. **Admin View**: All dogs visible with status pills

### Test Rate Limiting
1. Rapidly submit >10 reports within 10 minutes
2. Should receive HTTP 429 error
3. Wait for rate limit window to reset

## 🎯 Acceptance Criteria

### ✅ User Reporting
- [x] Report button appears on dog details for non-owners
- [x] Form validates category selection and optional message
- [x] Reports are successfully submitted to backend
- [x] Rate limiting prevents report spam

### ✅ Admin Dashboard
- [x] Admin users can access `/admin` route
- [x] Reports tab shows all reports with dog and reporter info
- [x] Dogs tab shows all dogs with visibility status
- [x] Action buttons work for hide/unhide/delete/status changes
- [x] All actions are logged in moderation_actions table

### ✅ Content Visibility
- [x] Hidden dogs don't appear in public dog listings
- [x] Deleted dogs don't appear in public dog listings
- [x] Dog owners can see their own hidden dogs
- [x] Admins can see all dogs regardless of status

### ✅ Security & Performance
- [x] Admin middleware protects sensitive routes
- [x] RLS policies enforce database-level security
- [x] Rate limiting prevents abuse of report/create endpoints
- [x] Audit trail logs all moderation actions

## 🔧 Environment Setup

No additional environment variables required. The moderation system uses existing Supabase configuration.

## 🚀 Next Steps

### Immediate Improvements
- Monitor report volumes and adjust rate limits
- Add email notifications for report actions
- Implement report analytics dashboard

### Future Enhancements
- Automated content moderation using AI
- Bulk moderation tools for admins
- Appeal process for moderated content
- Community moderation features

## 🐛 Troubleshooting

### Common Issues

#### Admin Access Denied
- Verify user role is set to 'admin' in public.users table
- Check JWT token is valid and not expired
- Ensure admin middleware is properly configured

#### Reports Not Visible
- Check RLS policies are properly configured
- Verify reporter_id matches authenticated user
- Ensure admin role is correctly set

#### Rate Limiting Issues
- Check rate limit configuration in middleware
- Verify user authentication for proper rate limiting
- Clear rate limit store if needed for testing

#### Dogs Not Hiding
- Verify moderation action was properly logged
- Check dog visibility queries include proper filters
- Ensure frontend refreshes data after actions

### Debug Commands

```bash
# Check moderation tables
psql -d postgres -c "SELECT * FROM public.reports LIMIT 5;"
psql -d postgres -c "SELECT * FROM public.moderation_actions LIMIT 5;"

# Verify dog moderation columns
psql -d postgres -c "SELECT id, name, is_hidden, deleted_at FROM public.dogs LIMIT 5;"

# Check admin users
psql -d postgres -c "SELECT id, name, email, role FROM public.users WHERE role = 'admin';"
```

Step 9 implementation is complete and ready for production use! 🛡️✨
