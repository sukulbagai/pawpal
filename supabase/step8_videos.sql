-- Step 8: Add Videos Support to Dogs Table
-- Run this in Supabase SQL Editor

-- Add videos column to dogs table
ALTER TABLE public.dogs
ADD COLUMN IF NOT EXISTS videos text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.dogs.videos IS 'Array of video URLs (uploaded to storage or external links like YouTube)';

-- Create index for performance (optional)
CREATE INDEX IF NOT EXISTS idx_dogs_videos ON public.dogs USING GIN(videos) WHERE videos IS NOT NULL AND array_length(videos, 1) > 0;
