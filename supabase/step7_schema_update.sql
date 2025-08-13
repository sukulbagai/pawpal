-- Step 7 Schema Updates for Adoption Requests
-- Run this in Supabase SQL Editor to update the adoption_requests table

-- Add updated_at column if it doesn't exist
ALTER TABLE public.adoption_requests 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update status column to use an enum for better type safety
DO $$ 
BEGIN
    -- Create status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'adoption_status') THEN
        CREATE TYPE adoption_status AS ENUM ('pending', 'approved', 'declined', 'cancelled');
    END IF;
END $$;

-- Update the status column type
ALTER TABLE public.adoption_requests 
ALTER COLUMN status TYPE adoption_status USING status::adoption_status;

-- Add unique constraint to prevent duplicate pending requests
-- (This will need to be added only if there are no existing duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_requests 
ON public.adoption_requests(dog_id, adopter_id) 
WHERE status = 'pending';

-- Update indexes for better performance
DROP INDEX IF EXISTS idx_adoption_requests_dog_status;
CREATE INDEX idx_adoption_requests_dog_status ON public.adoption_requests(dog_id, status, created_at);
CREATE INDEX idx_adoption_requests_adopter ON public.adoption_requests(adopter_id, created_at);

-- Add a function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_adoption_requests_updated_at ON public.adoption_requests;
CREATE TRIGGER update_adoption_requests_updated_at 
    BEFORE UPDATE ON public.adoption_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
