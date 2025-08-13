import React, { useState, useRef } from 'react';
import { uploadDogVideos, UploadProgress, validateVideoFile } from '../lib/upload';
import { useAuthStore } from '../store/useAuthStore';

interface VideoUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  disabled?: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ 
  value = [], 
  onChange, 
  max = 4, 
  disabled = false 
}) => {
  const { session } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canAddMore = value.length < max && !disabled;

  // Check if URL is YouTube, Google Drive, or other common video platforms
  const isValidExternalUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();
      
      return (
        hostname.includes('youtube.com') ||
        hostname.includes('youtu.be') ||
        hostname.includes('drive.google.com') ||
        hostname.includes('vimeo.com') ||
        hostname.includes('dailymotion.com') ||
        hostname.includes('streamable.com')
      );
    } catch {
      return false;
    }
  };

  const addExternalUrl = () => {
    if (!externalUrl.trim()) return;
    
    if (!isValidExternalUrl(externalUrl)) {
      alert('Please enter a valid video URL from YouTube, Google Drive, Vimeo, or other supported platforms.');
      return;
    }

    if (value.includes(externalUrl)) {
      alert('This video URL is already added.');
      return;
    }

    if (value.length >= max) {
      alert(`Maximum ${max} videos allowed.`);
      return;
    }

    onChange([...value, externalUrl]);
    setExternalUrl('');
  };

  const handleFileSelect = async (files: File[]) => {
    if (!session?.user?.id) {
      alert('Please log in to upload videos');
      return;
    }

    if (files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        alert(`Invalid file "${file.name}": ${validation.error}`);
        return;
      }
      validFiles.push(file);
    }

    // Check if adding these files would exceed the limit
    if (value.length + validFiles.length > max) {
      alert(`Cannot upload ${validFiles.length} files. Maximum ${max} videos allowed (${value.length} already uploaded).`);
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress([]);

      const results = await uploadDogVideos(
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
      file.type.startsWith('video/')
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

  const removeVideo = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const isUploadedVideo = (url: string): boolean => {
    return url.includes('/dog-videos/');
  };

  return (
    <div className="video-uploader">
      <div className="upload-count">
        {value.length}/{max} videos
      </div>

      {/* Video Previews */}
      {value.length > 0 && (
        <div className="video-previews">
          {value.map((url, index) => (
            <div key={index} className="video-preview">
              {isUploadedVideo(url) ? (
                <video 
                  controls 
                  muted 
                  style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                >
                  <source src={url} />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="external-video-preview">
                  <div className="video-icon">🎬</div>
                  <div className="video-url" title={url}>
                    {url.length > 30 ? `${url.substring(0, 30)}...` : url}
                  </div>
                  <div className="video-type">External Link</div>
                </div>
              )}
              <button
                type="button"
                className="remove-video"
                onClick={() => removeVideo(index)}
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

      {/* External URL Input */}
      {canAddMore && (
        <div className="external-url-section">
          <div className="external-url-input">
            <input
              type="url"
              placeholder="Paste YouTube, Google Drive, or other video URL..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addExternalUrl()}
              disabled={disabled}
            />
            <button
              type="button"
              onClick={addExternalUrl}
              disabled={disabled || !externalUrl.trim()}
              className="add-url-btn"
            >
              Add URL
            </button>
          </div>
          <p className="url-hint">
            Supports YouTube, Google Drive, Vimeo, and other video platforms
          </p>
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
            accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            disabled={disabled || isUploading}
          />
          
          {isUploading ? (
            <div className="upload-status">
              <div className="spinner" />
              <p>Uploading videos...</p>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">🎬</div>
              <p>
                <strong>Click to upload</strong> or drag videos here
              </p>
              <p className="upload-hint">
                MP4, WebM, QuickTime, AVI (max 20MB each)
              </p>
            </div>
          )}
        </div>
      )}

      {!canAddMore && !disabled && (
        <p className="upload-limit">
          Maximum {max} videos reached
        </p>
      )}
    </div>
  );
};

export default VideoUploader;
