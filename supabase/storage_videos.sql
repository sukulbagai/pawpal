-- Step 8: Create Storage Bucket and Policies for Dog Videos
-- Run this in Supabase SQL Editor (optional - only if you want video uploads)

-- Create dog-videos bucket for video uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dog-videos',
  'dog-videos', 
  true,
  20971520, -- 20MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for dog-videos bucket

-- Allow public read access to all videos
CREATE POLICY "Dog videos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'dog-videos');

-- Allow authenticated users to upload videos with specific path structure
CREATE POLICY "Users can upload dog videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'dog-videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND (storage.foldername(name))[2] = 'dogs'
  );

-- Allow users to delete their own uploaded videos
CREATE POLICY "Users can delete their own dog videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'dog-videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to update their own uploaded videos
CREATE POLICY "Users can update their own dog videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'dog-videos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Note: External video links (YouTube, Google Drive, etc.) don't require this bucket
-- The bucket is only needed if you want to allow direct video file uploads
