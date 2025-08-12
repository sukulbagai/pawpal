import { supabase } from './supabase';

// File type validation
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB
const MAX_FILES = 6;

export interface UploadProgress {
  file: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  url: string;
  filename: string;
}

/**
 * Validates file before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed. Please use JPG, PNG, or WebP images.'
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 4MB.'
    };
  }

  return { valid: true };
}

/**
 * Upload multiple dog images to Supabase Storage
 */
export async function uploadDogImages(
  files: File[], 
  authUserId: string,
  onProgress?: (progress: UploadProgress[]) => void
): Promise<UploadResult[]> {
  if (files.length === 0) {
    throw new Error('No files provided');
  }

  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} files allowed`);
  }

  // Validate all files first
  for (const file of files) {
    const validation = validateFile(file);
    if (!validation.valid) {
      throw new Error(`Invalid file "${file.name}": ${validation.error}`);
    }
  }

  const timestamp = Date.now();
  const results: UploadResult[] = [];
  const progressUpdates: UploadProgress[] = files.map((file) => ({
    file: file.name,
    progress: 0,
    status: 'uploading'
  }));

  if (onProgress) {
    onProgress([...progressUpdates]);
  }

  // Upload files sequentially to avoid overwhelming the connection
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storageKey = `${authUserId}/${timestamp}-${i}-${sanitizedName}`;

    try {
      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('dog-images')
        .upload(storageKey, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        progressUpdates[i] = {
          file: file.name,
          progress: 0,
          status: 'error',
          error: error.message
        };
        
        if (onProgress) {
          onProgress([...progressUpdates]);
        }
        
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('dog-images')
        .getPublicUrl(storageKey);

      if (!publicUrlData?.publicUrl) {
        throw new Error(`Failed to get public URL for ${file.name}`);
      }

      results.push({
        url: publicUrlData.publicUrl,
        filename: file.name
      });

      // Update progress
      progressUpdates[i] = {
        file: file.name,
        progress: 100,
        status: 'completed'
      };

      if (onProgress) {
        onProgress([...progressUpdates]);
      }

    } catch (error) {
      progressUpdates[i] = {
        file: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed'
      };
      
      if (onProgress) {
        onProgress([...progressUpdates]);
      }
      
      throw error;
    }
  }

  return results;
}

/**
 * Delete uploaded images (for cleanup on form cancellation)
 */
export async function deleteUploadedImages(urls: string[]): Promise<void> {
  for (const url of urls) {
    try {
      // Extract storage key from public URL
      const urlParts = url.split('/dog-images/');
      if (urlParts.length === 2) {
        const storageKey = urlParts[1];
        
        await supabase.storage
          .from('dog-images')
          .remove([storageKey]);
      }
    } catch (error) {
      console.error('Failed to delete image:', url, error);
      // Don't throw - this is cleanup, not critical
    }
  }
}
