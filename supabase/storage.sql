-- PawPal Storage Buckets and Policies
-- Run this in Supabase SQL Editor after schema and policies

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('dog-images', 'dog-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']), -- 5MB limit
    ('documents', 'documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']); -- 10MB limit

-- Storage policies for dog-images bucket (public read)
CREATE POLICY "Public read access for dog images" ON storage.objects
    FOR SELECT USING (bucket_id = 'dog-images');

CREATE POLICY "Authenticated users can upload dog images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'dog-images' 
        AND auth.role() = 'authenticated'
        AND (
            -- Path must start with user's auth.uid() or dogs/<dog_id>/
            name LIKE auth.uid()::text || '/%'
            OR name LIKE 'dogs/%'
        )
    );

CREATE POLICY "Users can delete own dog images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'dog-images' 
        AND (
            -- Can delete if they uploaded it (path starts with their ID)
            name LIKE auth.uid()::text || '/%'
            OR 
            -- Admin override (commented for now)
            false
        )
    );

-- Storage policies for documents bucket (private, signed URLs only)
CREATE POLICY "Authenticated users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can delete own documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' 
        AND (
            -- Can delete if they uploaded it (path contains their ID)
            name LIKE '%' || auth.uid()::text || '%'
            OR 
            -- Admin override (commented for now)
            false
        )
    );

-- No public SELECT policy for documents - access via signed URLs only
