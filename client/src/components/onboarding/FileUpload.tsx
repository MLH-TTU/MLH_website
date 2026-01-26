import React, { useState, useRef, useCallback } from 'react';
import { FileUploadProps } from '../../types';

const FileUpload: React.FC<FileUploadProps> = ({
  type,
  onUpload,
  onRemove,
  currentFile,
  loading = false,
  error,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentFile || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isProfilePicture = type === 'profile-picture';
  const title = isProfilePicture ? 'Profile Picture' : 'Resume';
  const description = isProfilePicture 
    ? 'Upload a profile picture (JPEG, PNG, WebP, max 5MB)'
    : 'Upload your resume (PDF only, max 10MB)';

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (isProfilePicture) {
      // Profile picture validation
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        return 'Please select a valid image file (JPEG, PNG, or WebP)';
      }
      if (file.size > maxSize) {
        return 'Image file size must be less than 5MB';
      }
    } else {
      // Resume validation
      const allowedTypes = ['application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        return 'Please select a PDF file';
      }
      if (file.size > maxSize) {
        return 'PDF file size must be less than 10MB';
      }
    }
    return null;
  }, [isProfilePicture]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      // Error will be handled by parent component
      return;
    }

    // Create preview for images
    if (isProfilePicture && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(file.name);
    }

    onUpload(file);
  }, [validateFile, isProfilePicture, onUpload]);

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle remove file
  const handleRemove = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onRemove();
  }, [onRemove]);

  // Handle click to select file
  const handleClick = useCallback(() => {
    if (!loading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [loading]);

  return (
    <div className="space-y-2">
      <h4 className="text-md font-medium text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600" id={`${type}-description`}>{description}</p>
      
      <div className="relative">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={isProfilePicture ? 'image/jpeg,image/png,image/webp' : 'application/pdf'}
          onChange={handleInputChange}
          className="sr-only"
          disabled={loading}
          id={`${type}-input`}
          aria-describedby={`${type}-description ${error ? `${type}-error` : ''}`}
        />

        {/* Upload area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick();
            }
          }}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragOver 
              ? 'border-indigo-500 bg-indigo-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          role="button"
          tabIndex={loading ? -1 : 0}
          aria-label={`Upload ${isProfilePicture ? 'profile picture' : 'resume'}`}
          aria-describedby={`${type}-description`}
        >
          {preview ? (
            <div className="space-y-4">
              {/* File preview */}
              {isProfilePicture && preview.startsWith('data:') ? (
                <div className="flex justify-center">
                  <img
                    src={preview}
                    alt="Profile preview"
                    className="w-32 h-32 object-cover rounded-full border-4 border-white shadow-lg"
                  />
                </div>
              ) : (
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              )}

              {/* File info and actions */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {isProfilePicture ? 'Profile picture uploaded' : preview}
                </p>
                <div className="flex justify-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    disabled={loading}
                    className="text-sm text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                    aria-label={`Replace ${isProfilePicture ? 'profile picture' : 'resume'}`}
                  >
                    Replace
                  </button>
                  <span className="text-gray-300" aria-hidden="true">|</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    disabled={loading}
                    className="text-sm text-red-600 hover:text-red-500 disabled:opacity-50"
                    aria-label={`Remove ${isProfilePicture ? 'profile picture' : 'resume'}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Upload icon */}
              <div className="flex justify-center">
                <svg 
                  className="w-12 h-12 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              {/* Upload text */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  {loading ? 'Uploading...' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-gray-500">
                  {isProfilePicture 
                    ? 'JPEG, PNG, WebP up to 5MB' 
                    : 'PDF up to 10MB'
                  }
                </p>
              </div>

              {/* Loading indicator */}
              {loading && (
                <div className="flex justify-center">
                  <svg 
                    className="animate-spin h-5 w-5 text-indigo-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p 
            id={`${type}-error`}
            className="mt-2 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;