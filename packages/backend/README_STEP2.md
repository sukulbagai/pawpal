# Step 2: Backend Foundation - Express + Supabase + Auth Middleware

This step implements a robust Express server with Supabase integration and JWT-based authentication middleware.

## 🏗️ Architecture

### Authentication Flow
1. **Frontend**: User authenticates with Supabase Auth
2. **Frontend**: Gets JWT access token from Supabase session
3. **Frontend**: Sends requests with `Authorization: Bearer <token>` header
4. **Backend**: Validates token with Supabase Admin client
5. **Backend**: Looks up user in `public.users` table
6. **Backend**: Attaches user info to `req` object

### Middleware Stack
- **CORS**: Configurable origins with credentials support
- **Morgan**: Request logging
- **JSON Parser**: 2MB limit for file uploads
- **Auth Middleware**: Optional and required authentication
- **Error Handler**: Centralized error responses

## 🔧 API Endpoints

### Health Check
```bash
GET /health
```
**Response:**
```json
{
  "ok": true,
  "service": "pawpal-api",
  "timestamp": "2025-08-12T16:00:00.000Z",
  "environment": "development"
}
```

### Protected Routes

#### Get Current User (Required Auth)
```bash
GET /protected/me
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "authUserId": "uuid-from-supabase-auth",
  "authEmail": "user@example.com",
  "userId": "internal-user-id",
  "userRole": "adopter"
}
```

#### Get Current User (Optional Auth)
```bash
GET /protected/me-optional
# Authorization header is optional
```
**Response (authenticated):**
```json
{
  "authUserId": "uuid-from-supabase-auth",
  "authEmail": "user@example.com", 
  "userId": "internal-user-id",
  "userRole": "adopter",
  "authenticated": true
}
```

**Response (guest):**
```json
{
  "authUserId": null,
  "authEmail": null,
  "userId": null,
  "userRole": null,
  "authenticated": false
}
```

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:4000/health
```

### 2. Protected Route (No Token)
```bash
curl http://localhost:4000/protected/me
# Expected: 401 Unauthorized
```

### 3. Protected Route (With Token)
```bash
# Get token from Supabase frontend session
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:4000/protected/me
```

### 4. Optional Auth Route
```bash
# Works without token
curl http://localhost:4000/protected/me-optional

# Works with token
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:4000/protected/me-optional
```

## 🔑 Getting Access Tokens

### From Frontend (Step 3)
In Step 3, we'll implement frontend auth and provide easy access to tokens.

### Manual Testing (Browser Console)
If you have frontend auth working:
```javascript
// In browser console on authenticated page
const { data: { session } } = await supabase.auth.getSession()
console.log('Access Token:', session?.access_token)
```

## 🛡️ Security Features

- **No Service Role Exposure**: Service role key never sent to frontend
- **Token Validation**: All tokens verified with Supabase
- **Role-Based Access**: User roles attached to requests
- **Error Handling**: No sensitive data in error responses
- **CORS Protection**: Configurable origin restrictions

## 📁 File Structure

```
packages/backend/src/
├── index.ts              # Express app setup
├── server.ts             # Server startup
├── routes/
│   ├── health.ts         # Health check routes
│   └── protected.ts      # Protected test routes
├── middleware/
│   ├── auth.ts           # Authentication middleware
│   └── errors.ts         # Error handling middleware
├── lib/
│   ├── supabase.ts       # Supabase admin client
│   └── users.ts          # User database helpers
└── types/
    └── express.d.ts      # Express Request extensions
```

## 🚀 Running

```bash
# Start development server
pnpm --filter @pawpal/backend dev

# Build for production
pnpm --filter @pawpal/backend build

# Start production server
pnpm --filter @pawpal/backend start
```

## 🔄 Next Steps (Step 3)

- Frontend authentication flow
- User bootstrap endpoint
- Session management
- Login/signup components

## 📝 Notes

- `userId` will be `null` until Step 3 implements user bootstrap
- Service role key allows bypassing RLS - use carefully
- All authentication is stateless (JWT-based)
- Error responses don't leak internal details in production
