# Step 9: Admin & Moderation System - Backend

This document covers the backend implementation of PawPal's comprehensive moderation system, including user reports, admin dashboard APIs, content visibility controls, and abuse prevention.

## 🎯 Features Implemented

### Core APIs
- **Reports API**: Create and manage user reports
- **Admin API**: Full moderation dashboard functionality
- **Enhanced Dogs API**: Content visibility filtering
- **Rate Limiting**: Abuse prevention for sensitive endpoints

### Database Integration
- **Reports Table**: Store user reports with categories and evidence
- **Moderation Actions**: Audit trail for all admin actions
- **Dog Moderation**: Hidden/deleted flags with soft delete
- **RLS Policies**: Row-level security for all moderation data

## 🚀 API Endpoints

### Reports API

#### POST /reports
Create a new report for inappropriate content.

**Authentication**: Required  
**Rate Limit**: 10 requests per 10 minutes

```bash
curl -X POST http://localhost:4000/reports \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "target_type": "dog",
    "target_id": "550e8400-e29b-41d4-a716-446655440000",
    "category": "abuse",
    "message": "Inappropriate content in description",
    "evidence_url": "https://example.com/screenshot.png"
  }'
```

**Response (201)**:
```json
{
  "ok": true,
  "report": {
    "id": "uuid",
    "target_type": "dog",
    "target_id": "uuid",
    "category": "abuse",
    "message": "Inappropriate content",
    "evidence_url": "https://example.com/evidence",
    "status": "open",
    "created_at": "2025-08-13T..."
  }
}
```

**Categories**: `abuse`, `spam`, `wrong-info`, `duplicate`, `other`

### Admin API (Admin Role Required)

#### GET /admin/reports
List all reports with filtering and pagination.

```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:4000/admin/reports?status=open&limit=50&offset=0"
```

**Query Parameters**:
- `status`: Filter by `open`, `actioned`, or `dismissed`
- `limit`: Results per page (1-100, default 50)
- `offset`: Pagination offset (default 0)

**Response**:
```json
{
  "ok": true,
  "items": [
    {
      "id": "uuid",
      "category": "abuse",
      "message": "Inappropriate content",
      "status": "open",
      "created_at": "2025-08-13T...",
      "dog": {
        "id": "uuid",
        "name": "Buddy",
        "area": "Delhi",
        "images": ["url1", "url2"],
        "status": "available"
      },
      "reporter": {
        "id": "uuid",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ],
  "total": 25
}
```

#### PATCH /admin/reports/:id
Take moderation action on a report.

```bash
curl -X PATCH http://localhost:4000/admin/reports/uuid \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "hide-dog",
    "notes": "Content violates community guidelines"
  }'
```

**Actions**:
- `hide-dog`: Hide the reported dog from public view
- `unhide-dog`: Make hidden dog visible again
- `soft-delete-dog`: Soft delete the dog (admin-only visible)
- `override-status`: Change dog adoption status (requires `meta.status`)
- `dismiss`: Dismiss the report without action

**Response**:
```json
{
  "ok": true,
  "report": {
    "id": "uuid",
    "status": "actioned",
    "updated_at": "2025-08-13T..."
  },
  "action": {
    "id": "uuid",
    "action": "hide-dog",
    "notes": "Content violates guidelines",
    "created_at": "2025-08-13T..."
  }
}
```

#### GET /admin/dogs
List all dogs including hidden and deleted (admin view).

```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:4000/admin/dogs?includeHidden=1&includeDeleted=1&limit=50"
```

**Query Parameters**:
- `includeHidden`: Include hidden dogs (default false)
- `includeDeleted`: Include soft-deleted dogs (default false)
- `limit`: Results per page (1-100, default 50)
- `offset`: Pagination offset (default 0)
- `q`: Text search in name/area

#### PATCH /admin/dogs/:id/visibility
Change dog visibility directly.

```bash
curl -X PATCH http://localhost:4000/admin/dogs/uuid/visibility \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"op": "hide"}'
```

**Operations**: `hide`, `unhide`, `soft-delete`

#### PATCH /admin/dogs/:id/status
Override dog adoption status.

```bash
curl -X PATCH http://localhost:4000/admin/dogs/uuid/status \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "adopted"}'
```

**Statuses**: `available`, `pending`, `adopted`

### Enhanced Dogs API

#### Content Visibility Rules
The dogs endpoints now respect content visibility based on viewer context:

1. **Public Users** (unauthenticated):
   - See only visible, non-deleted dogs
   - Hidden and deleted dogs return 404

2. **Authenticated Users**:
   - See all visible dogs
   - See their own hidden dogs with status indication
   - Deleted dogs still return 404

3. **Admin Users**:
   - See all dogs regardless of status
   - Hidden/deleted status included in response

#### GET /dogs (Enhanced)
Now includes optional authentication and viewer-aware filtering.

```bash
# Public request (no auth) - only visible dogs
curl http://localhost:4000/dogs

# Authenticated request - includes own hidden dogs
curl -H "Authorization: Bearer <token>" http://localhost:4000/dogs

# Admin request - sees everything
curl -H "Authorization: Bearer <admin-token>" http://localhost:4000/dogs
```

#### GET /dogs/:id (Enhanced)
Individual dog lookup with same visibility rules.

```bash
# Returns 404 for hidden dogs unless owner/admin
curl -H "Authorization: Bearer <token>" http://localhost:4000/dogs/uuid
```

## 🔧 Backend Architecture

### Middleware Components

#### Admin Middleware (`middleware/admin.ts`)
- Validates admin role after authentication
- Resolves user details from `auth_user_id`
- Adds admin context to request object
- Returns 403 for non-admin users

#### Rate Limiting (`middleware/ratelimit.ts`)
- Token bucket algorithm with in-memory storage
- Per-user limits (falls back to IP for unauthenticated)
- Configurable limits and refill periods
- Automatic cleanup of old entries

**Rate Limits**:
- Reports: 10 per 10 minutes
- Dog Creation: 10 per 10 minutes

### Library Components

#### Moderation Library (`lib/moderation.ts`)
Core moderation business logic:

- `createReport()`: Create new reports with validation
- `listReports()`: Query reports with filtering and pagination
- `actionReport()`: Execute moderation actions with audit logging
- `hideDog()`, `unhideDog()`, `softDeleteDog()`: Dog visibility controls
- `overrideDogStatus()`: Admin status overrides

#### Enhanced Dogs Library (`lib/dogs.ts`)
Extended with viewer-aware visibility:

- `listDogs(params, viewer?)`: Filtered listing based on viewer context
- `getDogById(id, viewer?)`: Individual lookup with visibility rules
- New `Viewer` interface for context passing

### Database Schema

#### Reports Table
```sql
CREATE TABLE reports (
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

#### Moderation Actions Table
```sql
CREATE TABLE moderation_actions (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reports(id),
  actor_user_id UUID REFERENCES users(id),
  action TEXT CHECK (action IN ('hide-dog', 'unhide-dog', 'soft-delete-dog', 'override-status', 'dismiss')),
  notes TEXT,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Dogs Table (Extended)
```sql
ALTER TABLE dogs 
  ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE,
  ADD COLUMN deleted_at TIMESTAMPTZ;
```

### Row Level Security (RLS)

#### Reports Policies
- **Insert**: Any authenticated user can create reports
- **Select**: Users can see their own reports + admins see all
- **Update**: Only admins can update report status

#### Moderation Actions Policies
- **Insert/Select**: Admin-only access
- All moderation actions are logged and auditable

## 🛡️ Security Features

### Authentication & Authorization
- JWT validation on all sensitive endpoints
- Role-based access control for admin functions
- Admin middleware with user role verification

### Content Safety
- Hidden dogs invisible to public but visible to owners
- Soft delete preserves data while hiding from all non-admins
- Evidence URLs validated for proper format

### Abuse Prevention
- Rate limiting prevents report/creation spam
- In-memory token bucket with automatic cleanup
- Configurable limits easy to adjust

### Data Integrity
- Comprehensive input validation with Zod schemas
- Foreign key constraints maintain referential integrity
- Audit trail for all moderation actions

## 🧪 Testing

### Setup Admin User
1. Create regular account via frontend signup
2. In Supabase Table Editor → `public.users`
3. Change `role` from 'adopter' to 'admin'

### API Testing Examples

```bash
# Create a report
curl -X POST http://localhost:4000/reports \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_type":"dog","target_id":"'$DOG_ID'","category":"spam","message":"Duplicate listing"}'

# List reports as admin
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  "http://localhost:4000/admin/reports?status=open"

# Hide a dog
curl -X PATCH http://localhost:4000/admin/reports/$REPORT_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action":"hide-dog","notes":"Community guidelines violation"}'

# Verify hidden dog not in public listing
curl http://localhost:4000/dogs | jq '.items[] | select(.id=="'$DOG_ID'")'
# Should return empty

# Verify owner can still see hidden dog
curl -H "Authorization: Bearer $OWNER_TOKEN" \
  "http://localhost:4000/dogs/$DOG_ID"
# Should return dog with is_hidden: true
```

### Rate Limit Testing
```bash
# Test report rate limiting
for i in {1..12}; do
  curl -X POST http://localhost:4000/reports \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"target_type":"dog","target_id":"'$DOG_ID'","category":"other"}'
  echo "Request $i"
done
# Should receive 429 after 10 requests
```

## 🐛 Troubleshooting

### Common Issues

#### Admin Access Denied
- Verify user role is 'admin' in database
- Check JWT token validity
- Ensure proper middleware order (auth before admin)

#### Reports Not Visible
- Check RLS policies are enabled
- Verify user permissions in database
- Check reporter_id foreign key constraint

#### Rate Limiting Issues
- Check rate limit headers in response
- Verify user authentication for proper limiting
- Consider clearing rate limit store for testing

#### Dogs Visibility Problems
- Verify viewer context is built correctly
- Check is_hidden and deleted_at columns
- Ensure proper filtering in listDogs query

### Debug Commands

```bash
# Check database schema
psql -d postgres -c "\d reports"
psql -d postgres -c "\d moderation_actions"

# Verify moderation columns on dogs
psql -d postgres -c "SELECT id, name, is_hidden, deleted_at FROM dogs LIMIT 5;"

# Check RLS policies
psql -d postgres -c "SELECT * FROM pg_policies WHERE tablename IN ('reports', 'moderation_actions');"

# Check admin users
psql -d postgres -c "SELECT id, name, email, role FROM users WHERE role = 'admin';"
```

## 📊 Performance Considerations

### Database Indexing
- Reports indexed by target and status for fast filtering
- Dogs indexed by moderation flags for visibility queries
- Moderation actions indexed by report_id for audit trails

### Rate Limiting
- In-memory storage for fast lookup
- Automatic cleanup prevents memory leaks
- Consider Redis for distributed deployments

### Query Optimization
- Viewer context built once per request
- Efficient filtering in database queries
- Proper use of database indexes

## 🚀 Production Deployment

### Environment Variables
No additional environment variables required. Uses existing Supabase configuration.

### Monitoring
- Log all moderation actions for audit
- Monitor rate limit hit rates
- Track report volume and resolution times

### Scaling Considerations
- Consider Redis for distributed rate limiting
- Monitor database query performance
- Add metrics for moderation workload

Step 9 backend implementation is complete and production-ready! 🛡️
