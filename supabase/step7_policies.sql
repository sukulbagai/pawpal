-- Row Level Security Policies for Step 7 Adoption Requests
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view adoption requests" ON public.adoption_requests;
DROP POLICY IF EXISTS "Users can insert adoption requests" ON public.adoption_requests;
DROP POLICY IF EXISTS "Users can update adoption requests" ON public.adoption_requests;

-- Allow service role to bypass RLS (for our backend)
ALTER TABLE public.adoption_requests DISABLE ROW LEVEL SECURITY;

-- Or if you want to keep RLS enabled, create permissive policies:
-- (Uncomment the following if you prefer to keep RLS enabled)

/*
-- Re-enable RLS
ALTER TABLE public.adoption_requests ENABLE ROW LEVEL SECURITY;

-- Policy for viewing adoption requests
CREATE POLICY "Users can view adoption requests" ON public.adoption_requests
    FOR SELECT USING (true);

-- Policy for inserting adoption requests
CREATE POLICY "Users can insert adoption requests" ON public.adoption_requests
    FOR INSERT WITH CHECK (true);

-- Policy for updating adoption requests
CREATE POLICY "Users can update adoption requests" ON public.adoption_requests
    FOR UPDATE USING (true);
*/

-- Ensure the service role can access all data
GRANT ALL ON public.adoption_requests TO service_role;
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.dogs TO service_role;
