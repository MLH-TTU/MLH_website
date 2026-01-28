'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ToastContainer';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/errorMessages';
import { updateUserProfile } from '@/lib/services/userProfile.client';
import { uploadProfilePicture, uploadResume, getFileUrl } from '@/lib/services/fileUpload';

export default function ProfilePage() {
  const { user, signOut, loading, refreshUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    major: '',
    universityLevel: 'freshman' as 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'other',
    aspiredPosition: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
  });

  useEffect(() => {
    if (user) {
      // Initialize form data
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        major: user.major || '',
        universityLevel: user.universityLevel || 'freshman',
        aspiredPosition: user.aspiredPosition || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        twitterUrl: user.twitterUrl || '',
      });
      
      // Load file URLs
      loadFileUrls();
    }
  }, [user?.uid]);

  const loadFileUrls = async () => {
    if (!user) return;
    
    try {
      if (user.profilePictureId) {
        const url = await getFileUrl(user.profilePictureId);
        setProfilePictureUrl(url);
      }
      
      if (user.resumeId) {
        const url = await getFileUrl(user.resumeId);
        setResumeUrl(url);
      }
    } catch (error) {
      console.error('Error loading file URLs:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast.showSuccess(SUCCESS_MESSAGES.SIGN_OUT_SUCCESS);
    router.push('/');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when canceling
      setEditFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        major: user?.major || '',
        universityLevel: user?.universityLevel || 'freshman',
        aspiredPosition: user?.aspiredPosition || '',
        githubUrl: user?.githubUrl || '',
        linkedinUrl: user?.linkedinUrl || '',
        twitterUrl: user?.twitterUrl || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaveLoading(true);

      await updateUserProfile(user.uid, editFormData);
      await refreshUser();
      
      toast.showSuccess(SUCCESS_MESSAGES.PROFILE_UPDATED);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.showError(ERROR_MESSAGES.PROFILE_UPDATE_FAILED, {
        onRetry: handleSaveProfile,
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'profile-picture' | 'resume') => {
    if (!user) return;

    try {
      setUploadingFile(true);

      if (type === 'profile-picture') {
        const result = await uploadProfilePicture(file, user.uid);
        await updateUserProfile(user.uid, { profilePictureId: result.fileId });
        await refreshUser();
        setProfilePictureUrl(result.downloadUrl);
        toast.showSuccess(SUCCESS_MESSAGES.FILE_UPLOADED);
      } else {
        const result = await uploadResume(file, user.uid);
        await updateUserProfile(user.uid, { resumeId: result.fileId });
        await refreshUser();
        setResumeUrl(result.downloadUrl);
        toast.showSuccess(SUCCESS_MESSAGES.FILE_UPLOADED);
      }
    } catch (error: any) {
      console.error('File upload failed:', error);
      
      // Check for specific error types
      if (error.message?.includes('size')) {
        toast.showError(ERROR_MESSAGES.FILE_SIZE_EXCEEDED);
      } else if (error.message?.includes('type')) {
        toast.showError(ERROR_MESSAGES.INVALID_FILE_TYPE);
      } else {
        toast.showError(ERROR_MESSAGES.FILE_UPLOAD_FAILED, {
          onRetry: () => handleFileUpload(file, type),
        });
      }
    } finally {
      setUploadingFile(false);
    }
  };

  const formatUniversityLevel = (level?: string) => {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">You need to be signed in to view this page.</p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <div className="flex items-center space-x-4">
              {!isEditing ? (
                <button
                  onClick={handleEditToggle}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    disabled={saveLoading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              {/* Profile Picture */}
              <div className="text-center mb-6">
                <div className="mx-auto h-32 w-32 rounded-full overflow-hidden bg-gray-200 mb-4 relative">
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <svg className="h-16 w-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                      <label className="cursor-pointer text-white text-xs font-medium">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingFile}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'profile-picture');
                          }}
                        />
                        {uploadingFile ? 'Uploading...' : 'Change Photo'}
                      </label>
                    </div>
                  )}
                </div>
                
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editFormData.firstName}
                        onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                        placeholder="First Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                        placeholder="Last Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={editFormData.aspiredPosition}
                      onChange={(e) => setEditFormData({ ...editFormData, aspiredPosition: e.target.value })}
                      placeholder="Aspired Position"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-gray-600">{user.aspiredPosition}</p>
                  </>
                )}
              </div>

              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Basic Information</h3>
                  <div className="mt-2 space-y-2">
                    {isEditing ? (
                      <>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">Major</label>
                          <input
                            type="text"
                            value={editFormData.major}
                            onChange={(e) => setEditFormData({ ...editFormData, major: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">University Level</label>
                          <select
                            value={editFormData.universityLevel}
                            onChange={(e) => setEditFormData({ ...editFormData, universityLevel: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="freshman">Freshman</option>
                            <option value="sophomore">Sophomore</option>
                            <option value="junior">Junior</option>
                            <option value="senior">Senior</option>
                            <option value="graduate">Graduate</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Major:</span>
                          <span className="text-sm font-medium text-gray-900">{user.major || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Level:</span>
                          <span className="text-sm font-medium text-gray-900">{formatUniversityLevel(user.universityLevel)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900 truncate">{user.email}</span>
                    </div>
                    {user.ttuEmail && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">TTU Email:</span>
                        <span className="text-sm font-medium text-gray-900 truncate">{user.ttuEmail}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Media Links */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Social Links</h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={editFormData.githubUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
                        placeholder="GitHub URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="url"
                        value={editFormData.linkedinUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                        placeholder="LinkedIn URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="url"
                        value={editFormData.twitterUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, twitterUrl: e.target.value })}
                        placeholder="Twitter/X URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {user.githubUrl && (
                        <a
                          href={user.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <span className="text-sm text-gray-900">GitHub</span>
                        </a>
                      )}
                      {user.linkedinUrl && (
                        <a
                          href={user.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span className="text-sm text-gray-900">LinkedIn</span>
                        </a>
                      )}
                      {user.twitterUrl && (
                        <a
                          href={user.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span className="text-sm text-gray-900">X (Twitter)</span>
                        </a>
                      )}
                      {!user.githubUrl && !user.linkedinUrl && !user.twitterUrl && (
                        <p className="text-sm text-gray-500 italic">No social links added</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Resume Section */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Resume</h3>
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="block">
                        <span className="sr-only">Choose resume file</span>
                        <input
                          type="file"
                          accept=".pdf,.docx"
                          disabled={uploadingFile}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'resume');
                          }}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-medium
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100
                            disabled:opacity-50"
                        />
                      </label>
                      {resumeUrl && (
                        <p className="text-xs text-gray-500">Current resume uploaded</p>
                      )}
                    </div>
                  ) : resumeUrl ? (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center space-x-2 p-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                      </svg>
                      <span className="text-sm font-medium text-gray-900">Download Resume</span>
                    </a>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No resume uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Account Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">User ID</label>
                  <p className="mt-1 text-sm text-gray-600 font-mono">{user.uid}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    Onboarding Status
                  </label>
                  <p className="mt-1">
                    {user.hasCompletedOnboarding ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Incomplete
                      </span>
                    )}
                  </p>
                </div>

                {user.ttuEmailVerified !== undefined && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500">
                      TTU Email Verification
                    </label>
                    <p className="mt-1">
                      {user.ttuEmailVerified ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Not Verified
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
