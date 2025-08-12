# Step 3: Auth Flow (Frontend + Backend Bootstrap)

## 🎯 What We Built

Complete authentication system with Supabase Auth, Google OAuth, email/password signup/login, and automatic user bootstrapping.

### Frontend Features
- **Login Page** (`/login`) - Email/password + Google OAuth
- **Signup Page** (`/signup`) - Account creation with name, email, password
- **Navbar** - Shows auth state, user info, login/logout
- **Auth Store** - Zustand state management for session and user data
- **API Client** - Axios with automatic token injection
- **Auth Listener** - Automatic bootstrap on first login

### Backend Features
- **Bootstrap Endpoint** - `POST /auth/bootstrap-user` creates `public.users` row
- **User Management** - Complete CRUD for user profiles
- **JWT Validation** - All protected routes validate Supabase tokens

## 🚀 How Authentication Works

### 1. User Signs Up/Logs In
- **Email/Password**: Uses `supabase.auth.signInWithPassword()` or `supabase.auth.signUp()`
- **Google OAuth**: Uses `supabase.auth.signInWithOAuth()` with Google provider

### 2. Auth State Changes
- Auth listener detects session changes
- On `SIGNED_IN` event, calls bootstrap endpoint
- Bootstrap creates row in `public.users` table

### 3. API Requests
- Axios interceptor adds `Authorization: Bearer <token>` header
- Backend validates token and resolves user data
- Request object gets `authUserId`, `userId`, `userRole` properties

## 🧪 Testing the Flow

### Manual Testing

1. **Start the servers**:
   ```bash
   pnpm dev
   ```

2. **Test signup**:
   - Visit http://localhost:5173/signup
   - Fill form and submit
   - Should redirect to home page with user greeting

3. **Test login**:
   - Visit http://localhost:5173/login
   - Use email/password or Google button
   - Should redirect to home page

4. **Test API integration**:
   - Open browser console after login
   - Should see "✅ User bootstrapped: [Name]"
   - Navbar should show user name and logout button

### API Testing

Get your access token for testing:
```javascript
// In browser console after login:
const { data } = await supabase.auth.getSession();
console.log(data.session?.access_token);
```

Test protected endpoints:
```bash
# Replace <ACCESS_TOKEN> with your actual token
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:4000/protected/me

# Should return:
{
  "authUserId": "uuid-from-supabase-auth",
  "authEmail": "user@example.com", 
  "userId": "uuid-from-public-users",
  "userRole": "adopter"
}
```

Test bootstrap endpoint:
```bash
curl -X POST -H "Authorization: Bearer <ACCESS_TOKEN>" http://localhost:4000/auth/bootstrap-user

# Should return:
{
  "ok": true,
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "role": "adopter"
  }
}
```

## ⚙️ Supabase Configuration

### Required Setup in Supabase Dashboard

1. **Authentication → Providers → Google**:
   - Enable Google provider
   - Add your Google OAuth credentials

2. **Authentication → Settings**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173`, `http://localhost:5173/auth/callback`

3. **For Development**:
   - Disable email confirmation: Authentication → Settings → "Enable email confirmations" = OFF
   - This speeds up the signup flow in development

### Google OAuth Setup

1. **Google Cloud Console** (https://console.cloud.google.com/):
   - Create/select project
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized origins: `http://localhost:5173`
   - Add authorized redirects: your Supabase callback URL

2. **Copy credentials to Supabase**:
   - Client ID and Client Secret → Supabase Auth providers

## 🔧 Environment Variables

Ensure these are set in your `.env` files:

**Frontend** (`.env.local`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_BASE=http://localhost:4000
```

**Backend** (`.env`):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=eyJ...
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

## 🚦 Acceptance Criteria Status

### ✅ All Requirements Met

1. **Login with Google** - OAuth flow works, returns to app with session
2. **Email/Password Signup/Login** - Form validation, success/error handling
3. **Auto Bootstrap** - Single call to `/auth/bootstrap-user` on first login
4. **Navbar Updates** - Shows user name, logout button when authenticated
5. **Protected Routes** - `/protected/me` returns 200 with user IDs when authenticated

### Routes Available
- `/` - Home page with auth status
- `/login` - Login form
- `/signup` - Signup form  
- `/post-dog` - Placeholder (Step 5)
- `/dashboard` - Placeholder (Step 7)

## 🔗 Next Steps (Step 4)

Ready for **Personality tags + seed data**:
- Seed personality tag taxonomy
- Seed sample dogs across Delhi/NCR
- Backend routes for fetching dogs and tags
- Frontend dog list with basic cards

## 🐛 Troubleshooting

### "Bootstrap failed" Error
- Check Supabase environment variables
- Verify database schema exists (run Step 1 SQL)
- Check network connection to backend

### Google OAuth Not Working
- Verify Google Cloud Console setup
- Check Supabase redirect URLs
- Ensure Google provider is enabled in Supabase

### User Not Found After Login
- Check if bootstrap endpoint was called
- Verify RLS policies allow user creation
- Check backend logs for errors

The authentication foundation is complete and ready for the next phase! 🐕✨
