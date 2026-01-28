'use client';

import { useState, useRef } from 'react';

export interface FileUploadsData {
  profilePicture?: File;
  resume?: File;
}

interface FileUploadsStepProps {
  data: FileUploadsData;
  onNext: (data: FileUploadsData) => void;
  onBack: () => void;
}

export default function FileUploadsStep({ data, onNext, onBack }: FileUploadsStepProps) {
  const [profilePicture, setProfilePicture] = useState<File | undefined>(data.profilePicture);
  const [resume, setResume] = useState<File | undefined>(data.resume);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ profilePicture?: string; resume?: string }>({});
  const [dragActive, setDragActive] = useState<{ profile: boolean; resume: boolean }>({
    profile: false,
    resume: false,
  });

  const profileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Generate preview for profile picture
  const generatePreview = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProfilePictureChange = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        profilePicture: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)',
      }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        profilePicture: 'Profile picture must be less than 5MB',
      }));
      return;
    }

    setProfilePicture(file);
    generatePreview(file);
    setErrors((prev) => ({ ...prev, profilePicture: undefined }));
  };

  const handleResumeChange = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        resume: 'Please upload a PDF or DOCX file',
      }));
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        resume: 'Resume must be less than 10MB',
      }));
      return;
    }

    setResume(file);
    setErrors((prev) => ({ ...prev, resume: undefined }));
  };

  const handleDrag = (e: React.DragEvent, type: 'profile' | 'resume') => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive((prev) => ({ ...prev, [type]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'profile' | 'resume') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (type === 'profile') {
        handleProfilePictureChange(e.dataTransfer.files[0]);
      } else {
        handleResumeChange(e.dataTransfer.files[0]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ profilePicture, resume });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">File Uploads</h2>
        <p className="text-gray-600 dark:text-gray-300">Upload your profile picture and resume (optional)</p>
      </div>

      {/* Profile Picture Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Profile Picture
        </label>
        <div
          onDragEnter={(e) => handleDrag(e, 'profile')}
          onDragLeave={(e) => handleDrag(e, 'profile')}
          onDragOver={(e) => handleDrag(e, 'profile')}
          onDrop={(e) => handleDrop(e, 'profile')}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive.profile
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-red-400'
          }`}
          onClick={() => profileInputRef.current?.click()}
        >
          {profilePreview ? (
            <div className="space-y-2">
              <img
                src={profilePreview}
                alt="Profile preview"
                className="w-32 h-32 object-cover rounded-full mx-auto"
              />
              <p className="text-sm text-gray-600">{profilePicture?.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfilePicture(undefined);
                  setProfilePreview(null);
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm text-gray-600">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
            </div>
          )}
        </div>
        <input
          ref={profileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleProfilePictureChange(e.target.files?.[0] || null)}
          className="hidden"
        />
        {errors.profilePicture && (
          <p className="mt-1 text-sm text-red-600">{errors.profilePicture}</p>
        )}
      </div>

      {/* Resume Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          Resume
        </label>
        <div
          onDragEnter={(e) => handleDrag(e, 'resume')}
          onDragLeave={(e) => handleDrag(e, 'resume')}
          onDragOver={(e) => handleDrag(e, 'resume')}
          onDrop={(e) => handleDrop(e, 'resume')}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragActive.resume
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-red-400'
          }`}
          onClick={() => resumeInputRef.current?.click()}
        >
          {resume ? (
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-600">{resume.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setResume(undefined);
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-gray-600">
                Drag and drop or click to upload
              </p>
              <p className="text-xs text-gray-500">PDF or DOCX up to 10MB</p>
            </div>
          )}
        </div>
        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => handleResumeChange(e.target.files?.[0] || null)}
          className="hidden"
        />
        {errors.resume && (
          <p className="mt-1 text-sm text-red-600">{errors.resume}</p>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Next
        </button>
      </div>
    </form>
  );
}
