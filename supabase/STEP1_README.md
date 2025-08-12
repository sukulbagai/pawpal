# Step 1: Supabase Setup Guide

This directory contains all the SQL files and setup instructions for configuring Supabase for the PawPal project.

## Files Overview

- `schema.sql` - Database tables, types, and indexes
- `policies.sql` - Row Level Security policies  
- `storage.sql` - Storage buckets and policies
- `seed.sql` - Sample data (personality tags + ~20 test dogs)

## Setup Instructions

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name: `pawpal`
3. Choose a database password (save it securely)
4. Wait for project to be created

### 2. Run SQL Files

Execute the SQL files in this exact order using the Supabase SQL Editor:

#### Method A: Supabase Dashboard (Recommended)
1. Go to your project dashboard
2. Navigate to **SQL Editor** in the sidebar
3. Copy and paste each file content and run:

```sql
-- 1. First run schema.sql
-- Creates tables, types, indexes, enables RLS

-- 2. Then run policies.sql  
-- Creates all Row Level Security policies

-- 3. Then run storage.sql
-- Creates storage buckets and policies

-- 4. Finally run seed.sql
-- Inserts personality tags and sample dogs
```

#### Method B: Supabase CLI (Advanced)
```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### 3. Get Environment Variables

After creating your project, get these values from your Supabase dashboard:

#### Project Settings → API
- `VITE_SUPABASE_URL` - Your project URL
- `VITE_SUPABASE_ANON_KEY` - Anonymous public key (anon/public)
- `SUPABASE_SERVICE_ROLE` - Service role key (keep secret!)

### 4. Configure Authentication

#### Enable Email/Password Auth
1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Disable email confirmations for development:
   - **Authentication** → **Settings**
   - Disable "Enable email confirmations"

#### Optional: Enable Google OAuth
1. **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add OAuth credentials from Google Cloud Console
4. Set authorized domains:
   - `localhost:5173` (development)
   - Your production domain (later)

### 5. Configure URLs

#### Site URL and Redirect URLs
1. **Authentication** → **Settings**
2. **Site URL**: `http://localhost:5173`
3. **Redirect URLs**: 
   ```
   http://localhost:5173
   http://localhost:5173/auth/callback
   ```

### 6. Verify Storage Buckets

1. Go to **Storage** in dashboard
2. Verify these buckets exist:
   - `dog-images` (public)
   - `documents` (private)
3. Test upload a file to confirm policies work

### 7. Update Environment Files

Copy the example files and fill in your Supabase credentials:

```bash
# Frontend
cp packages/frontend/.env.example packages/frontend/.env.local
# Edit .env.local with your Supabase URL and anon key

# Backend  
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your Supabase URL and service role key
```

## Environment Variables Reference

### Frontend (.env.local)
```bash
VITE_API_BASE=http://localhost:4000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Backend (.env)
```bash
PORT=4000
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.your-project.supabase.co:5432/postgres
```

## Troubleshooting

### RLS Debugging
If you get permission denied errors, temporarily disable RLS for testing:
```sql
-- Disable RLS on a table (DANGEROUS - for debugging only)
ALTER TABLE public.dogs DISABLE ROW LEVEL SECURITY;

-- Re-enable when done
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
```

### Storage Issues
- Make sure buckets are created before testing uploads
- Check bucket policies in Storage → Policies
- Verify file size limits (5MB for images, 10MB for documents)

### Common Errors
- **"relation does not exist"** - Run schema.sql first
- **"permission denied"** - Check RLS policies in policies.sql  
- **"bucket does not exist"** - Run storage.sql
- **Missing auth user** - Will be handled in Step 3 (bootstrap)

## Next Steps

After completing this setup:

1. ✅ **Verify**: All SQL runs without errors
2. ✅ **Test**: Storage buckets accept uploads via dashboard
3. ✅ **Confirm**: Frontend Supabase client instantiates without errors
4. ✅ **Security**: Service role key is NEVER referenced in frontend code

You're now ready for **Step 2: Backend Foundation** where we'll add Supabase integration to the Express server and create auth middleware.

## Sample Data

The seed.sql includes:
- **24 personality tags** across 5 categories (temperament, energy, playfulness, sociability, special needs)
- **20 sample dogs** across Delhi/NCR areas with realistic profiles
- Mixed health statuses and personality combinations
- Geographic spread across Saket, Rohini, Dwarka, Noida, Gurgaon, Ghaziabad

Perfect for testing the frontend once we build the listing pages!
