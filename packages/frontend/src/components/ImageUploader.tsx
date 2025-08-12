import React, { useState, useRef } from 'react';
import { uploadDogImages, UploadProgress, validateFile } from '../lib/upload';
import { useAuthStore } from '../store/useAuthStore';

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  disabled?: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  value = [], 
  onChange, 
  max = 6, 
  disabled = false 
}) => {
  const { session } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = value.length < max && !disabled;

  const handleFileSelect = async (files: File[]) => {
    if (!session?.user?.id) {
      alert('Please log in to upload images');
      return;
    }

    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(`Invalid file "${file.name}": ${validation.error}`);
        return;
      }
      validFiles.push(file);
    }

    // Check if adding these files would exceed the limit
    if (value.length + validFiles.length > max) {
      alert(`Cannot upload ${validFiles.length} files. Maximum ${max} images allowed (${value.length} already uploaded).`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress([]);

      const results = await uploadDogImages(
        validFiles, 
        session.user.id, 
        (progress) => {
          setUploadProgress(progress);
        }
      );

      // Add new URLs to existing ones
      const newUrls = results.map(r => r.url);
      onChange([...value, ...newUrls]);

      setUploadProgress([]);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelect(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-uploader">
      <div className="upload-count">
        {value.length}/{max} images
      </div>

      {/* Image Previews */}
      {value.length > 0 && (
        <div className="image-previews">
          {value.map((url, index) => (
            <div key={index} className="image-preview">
              <img src={url} alt={`Upload ${index + 1}`} />
              <button
                type="button"
                className="remove-image"
                onClick={() => removeImage(index)}
                disabled={disabled}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="upload-progress">
          {uploadProgress.map((progress, index) => (
            <div key={index} className="progress-item">
              <span className="filename">{progress.file}</span>
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${progress.status}`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
              {progress.status === 'error' && (
                <span className="error-text">{progress.error}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`upload-area ${dragOver ? 'drag-over' : ''} ${disabled ? 'disabled' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={!isUploading ? openFileDialog : undefined}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="upload-status">
              <div className="spinner" />
              <p>Uploading images...</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">📷</div>
              <p>
                <strong>Click to upload</strong> or drag images here
              </p>
              <p className="upload-hint">
                JPG, PNG, WebP (max 4MB each)
              </p>
            </div>
          )}
        </div>
      )}

      {!canAddMore && !disabled && (
        <p className="upload-limit">
          Maximum {max} images reached
        </p>
      )}
    </div>
  );
};

export default ImageUploader;
