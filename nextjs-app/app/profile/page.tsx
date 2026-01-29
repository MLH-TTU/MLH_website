'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/hooks/useToastCompat';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants/errorMessages';
import { updateUserProfile } from '@/lib/services/userProfile.client';
import { uploadProfilePicture, uploadResume, getFileUrl } from '@/lib/services/fileUpload';

export default function ProfilePage() {
  const { user, signOut, loading, refreshUser } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const prefersReducedMotion = useReducedMotion();
  
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'account'>('profile');
  
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
      loadFileUrls();
    }
  }, [user?.uid]);

  // Use useEffect for client-side redirect to avoid SSR issues - must be at top level before any returns
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

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
    return <LoadingScreen message="Loading your profile..." />;
  }

  if (!user) {
    return <LoadingScreen message="Redirecting..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 font-sans transition-colors duration-200">
      {/* Floating Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-3">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto w-fit rounded-full px-8 py-3 bg-white/10 dark:bg-gray-800/30 backdrop-blur-[20px] backdrop-saturate-[180%] border border-white/20 dark:border-gray-700/30 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.3)]">
            <div className="flex items-center justify-between min-w-[300px] gap-6">
              <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                <img src="https://static.mlh.io/brand-assets/logo/official/mlh-logo-color.png" alt="MLH Logo" className="h-6 w-auto" />
                <div className="h-7 w-px bg-gray-400"></div>
                <img src="https://www.ttu.edu/traditions/images/DoubleT.gif" alt="TTU Logo" className="h-6 w-auto" />
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        {/* Header Section */}
        <div className={`mb-8 ${!prefersReducedMotion ? 'animate-on-load animate-hero' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Profile</h1>
              <p className="text-gray-600 dark:text-gray-300">Manage your account settings and preferences</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isEditing ? (
                <Button
                  onClick={handleEditToggle}
                >
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    variant="success"
                  >
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    onClick={handleEditToggle}
                    disabled={saveLoading}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                </>
              )}
              <Button
                onClick={handleSignOut}
                variant="secondary"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className={`mb-6 ${!prefersReducedMotion ? 'animate-on-load animate-fade-in animation-delay-200' : ''}`}>
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <Button
                onClick={() => setActiveTab('profile')}
                variant="ghost"
                className={`rounded-none border-b-2 ${
                  activeTab === 'profile'
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Profile Information
              </Button>
              <Button
                onClick={() => setActiveTab('account')}
                variant="ghost"
                className={`rounded-none border-b-2 ${
                  activeTab === 'account'
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                Account Details
              </Button>
            </nav>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${!prefersReducedMotion ? 'animate-on-load animate-fade-in animation-delay-300' : ''}`}>
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                {/* Profile Picture */}
                <div className="text-center mb-6">
                  <div className="mx-auto h-32 w-32 rounded-full overflow-hidden bg-gradient-to-br from-red-400 to-red-600 mb-4 relative ring-4 ring-white dark:ring-gray-700 shadow-lg">
                    {profilePictureUrl ? (
                      <img src={profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg className="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      </div>
                    )}
                    {isEditing && (
                      <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center rounded-full cursor-pointer hover:bg-opacity-70 transition-all">
                        <label className="cursor-pointer text-white text-xs font-medium text-center px-2">
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
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editFormData.firstName}
                          onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                          placeholder="First Name"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                        />
                        <input
                          type="text"
                          value={editFormData.lastName}
                          onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                          placeholder="Last Name"
                          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      <input
                        type="text"
                        value={editFormData.aspiredPosition}
                        onChange={(e) => setEditFormData({ ...editFormData, aspiredPosition: e.target.value })}
                        placeholder="Aspired Position"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                        {user.firstName} {user.lastName}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{user.aspiredPosition || 'No position specified'}</p>
                    </>
                  )}
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 my-6"></div>

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Basic Information</h3>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Major</label>
                        <input
                          type="text"
                          value={editFormData.major}
                          onChange={(e) => setEditFormData({ ...editFormData, major: e.target.value })}
                          placeholder="e.g. Computer Science"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University Level</label>
                        <select
                          value={editFormData.universityLevel}
                          onChange={(e) => setEditFormData({ ...editFormData, universityLevel: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                        >
                          <option value="freshman">Freshman</option>
                          <option value="sophomore">Sophomore</option>
                          <option value="junior">Junior</option>
                          <option value="senior">Senior</option>
                          <option value="graduate">Graduate</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Major</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{user.major || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Level</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{formatUniversityLevel(user.universityLevel)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Email</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{user.email}</span>
                      </div>
                      {user.ttuEmail && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">TTU Email</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{user.ttuEmail}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Links & Resume */}
            <div className="lg:col-span-2 space-y-6">
              {/* Social Media Links */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Social Links</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GitHub URL</label>
                      <input
                        type="url"
                        value={editFormData.githubUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, githubUrl: e.target.value })}
                        placeholder="https://github.com/username"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">LinkedIn URL</label>
                      <input
                        type="url"
                        value={editFormData.linkedinUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Twitter/X URL</label>
                      <input
                        type="url"
                        value={editFormData.twitterUrl}
                        onChange={(e) => setEditFormData({ ...editFormData, twitterUrl: e.target.value })}
                        placeholder="https://twitter.com/username"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {user.githubUrl ? (
                      <a
                        href={user.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <svg className="h-5 w-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">GitHub</span>
                      </a>
                    ) : (
                      <div className="flex items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 opacity-50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">No GitHub</span>
                      </div>
                    )}
                    {user.linkedinUrl ? (
                      <a
                        href={user.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">LinkedIn</span>
                      </a>
                    ) : (
                      <div className="flex items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 opacity-50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">No LinkedIn</span>
                      </div>
                    )}
                    {user.twitterUrl ? (
                      <a
                        href={user.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600"
                      >
                        <svg className="h-5 w-5 text-gray-900 dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">X/Twitter</span>
                      </a>
                    ) : (
                      <div className="flex items-center justify-center p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 opacity-50">
                        <span className="text-sm text-gray-500 dark:text-gray-400">No Twitter</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Resume Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-200">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resume</h3>
                {isEditing ? (
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Upload Resume (PDF or DOCX)</span>
                      <input
                        type="file"
                        accept=".pdf,.docx"
                        disabled={uploadingFile}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, 'resume');
                        }}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-medium
                          file:bg-red-50 dark:file:bg-red-900/20 file:text-red-700 dark:file:text-red-400
                          hover:file:bg-red-100 dark:hover:file:bg-red-900/30
                          disabled:opacity-50 disabled:cursor-not-allowed
                          cursor-pointer"
                      />
                    </label>
                    {resumeUrl && (
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Resume uploaded successfully
                      </p>
                    )}
                  </div>
                ) : resumeUrl ? (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-3 p-4 border-2 border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                  >
                    <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                    </svg>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Download Resume</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Click to view or download</p>
                    </div>
                    <svg className="h-5 w-5 text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                    <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No resume uploaded yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className={`${!prefersReducedMotion ? 'animate-on-load animate-fade-in animation-delay-300' : ''}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 transition-colors duration-200">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Account Information</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">User ID</label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-900 dark:text-white font-mono break-all">{user.uid}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Email Address</label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      <p className="text-sm text-gray-900 dark:text-white break-all">{user.email}</p>
                    </div>
                  </div>

                  {user.ttuEmail && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">TTU Email</label>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <p className="text-sm text-gray-900 dark:text-white break-all">{user.ttuEmail}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Onboarding Status</label>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                      {user.hasCompletedOnboarding ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                          <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Incomplete
                        </span>
                      )}
                    </div>
                  </div>

                  {user.ttuEmailVerified !== undefined && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">TTU Email Verification</label>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        {user.ttuEmailVerified ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400">
                            <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Not Verified
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
