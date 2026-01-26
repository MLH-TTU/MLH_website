import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { TechnologyCategory, UniversityLevel } from '../types';
import { apiClient } from '../utils/api';
import Navigation from '../components/Navigation';
import TechnologySelector from '../components/onboarding/TechnologySelector';
import SocialMediaLinks from '../components/onboarding/SocialMediaLinks';
import FileUpload from '../components/onboarding/FileUpload';

// Technology data from TechnologySelector for display purposes
const PREDEFINED_TECHNOLOGIES = [
  // Languages
  { id: 'javascript', name: 'JavaScript', category: TechnologyCategory.LANGUAGE },
  { id: 'typescript', name: 'TypeScript', category: TechnologyCategory.LANGUAGE },
  { id: 'python', name: 'Python', category: TechnologyCategory.LANGUAGE },
  { id: 'java', name: 'Java', category: TechnologyCategory.LANGUAGE },
  { id: 'csharp', name: 'C#', category: TechnologyCategory.LANGUAGE },
  { id: 'cpp', name: 'C++', category: TechnologyCategory.LANGUAGE },
  { id: 'go', name: 'Go', category: TechnologyCategory.LANGUAGE },
  { id: 'rust', name: 'Rust', category: TechnologyCategory.LANGUAGE },
  { id: 'php', name: 'PHP', category: TechnologyCategory.LANGUAGE },
  { id: 'ruby', name: 'Ruby', category: TechnologyCategory.LANGUAGE },
  
  // Frameworks
  { id: 'react', name: 'React', category: TechnologyCategory.FRAMEWORK },
  { id: 'vue', name: 'Vue.js', category: TechnologyCategory.FRAMEWORK },
  { id: 'angular', name: 'Angular', category: TechnologyCategory.FRAMEWORK },
  { id: 'nodejs', name: 'Node.js', category: TechnologyCategory.FRAMEWORK },
  { id: 'express', name: 'Express', category: TechnologyCategory.FRAMEWORK },
  { id: 'nextjs', name: 'Next.js', category: TechnologyCategory.FRAMEWORK },
  { id: 'django', name: 'Django', category: TechnologyCategory.FRAMEWORK },
  { id: 'flask', name: 'Flask', category: TechnologyCategory.FRAMEWORK },
  { id: 'spring', name: 'Spring Boot', category: TechnologyCategory.FRAMEWORK },
  { id: 'dotnet', name: '.NET', category: TechnologyCategory.FRAMEWORK },
  
  // Databases
  { id: 'mongodb', name: 'MongoDB', category: TechnologyCategory.DATABASE },
  { id: 'postgresql', name: 'PostgreSQL', category: TechnologyCategory.DATABASE },
  { id: 'mysql', name: 'MySQL', category: TechnologyCategory.DATABASE },
  { id: 'redis', name: 'Redis', category: TechnologyCategory.DATABASE },
  { id: 'sqlite', name: 'SQLite', category: TechnologyCategory.DATABASE },
  { id: 'firebase', name: 'Firebase', category: TechnologyCategory.DATABASE },
  
  // Tools
  { id: 'git', name: 'Git', category: TechnologyCategory.TOOL },
  { id: 'docker', name: 'Docker', category: TechnologyCategory.TOOL },
  { id: 'kubernetes', name: 'Kubernetes', category: TechnologyCategory.TOOL },
  { id: 'webpack', name: 'Webpack', category: TechnologyCategory.TOOL },
  { id: 'vite', name: 'Vite', category: TechnologyCategory.TOOL },
  { id: 'jest', name: 'Jest', category: TechnologyCategory.TOOL },
  { id: 'cypress', name: 'Cypress', category: TechnologyCategory.TOOL },
  
  // Cloud
  { id: 'aws', name: 'AWS', category: TechnologyCategory.CLOUD },
  { id: 'azure', name: 'Azure', category: TechnologyCategory.CLOUD },
  { id: 'gcp', name: 'Google Cloud', category: TechnologyCategory.CLOUD },
  { id: 'vercel', name: 'Vercel', category: TechnologyCategory.CLOUD },
  { id: 'netlify', name: 'Netlify', category: TechnologyCategory.CLOUD },
  { id: 'heroku', name: 'Heroku', category: TechnologyCategory.CLOUD },
];

const CATEGORY_LABELS = {
  [TechnologyCategory.LANGUAGE]: 'Languages',
  [TechnologyCategory.FRAMEWORK]: 'Frameworks',
  [TechnologyCategory.DATABASE]: 'Databases',
  [TechnologyCategory.TOOL]: 'Tools',
  [TechnologyCategory.CLOUD]: 'Cloud',
  [TechnologyCategory.OTHER]: 'Other',
};

const CATEGORY_COLORS = {
  [TechnologyCategory.LANGUAGE]: 'bg-blue-100 text-blue-800',
  [TechnologyCategory.FRAMEWORK]: 'bg-green-100 text-green-800',
  [TechnologyCategory.DATABASE]: 'bg-purple-100 text-purple-800',
  [TechnologyCategory.TOOL]: 'bg-yellow-100 text-yellow-800',
  [TechnologyCategory.CLOUD]: 'bg-indigo-100 text-indigo-800',
  [TechnologyCategory.OTHER]: 'bg-gray-100 text-gray-800',
};

const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    major: '',
    universityLevel: UniversityLevel.FRESHMAN,
    aspiredPosition: '',
    githubUrl: '',
    linkedinUrl: '',
    twitterUrl: '',
    technologySkills: [] as string[]
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // Handle logout and redirect to landing page
  const handleLogout = async () => {
    try {
      await logout();
      // The logout function in AuthContext already redirects to '/'
    } catch (error) {
      console.error('Logout failed:', error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  useEffect(() => {
    if (user) {
      loadFileUrls();
      // Initialize edit form data with current user data
      setEditFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        major: user.major || '',
        universityLevel: user.universityLevel || UniversityLevel.FRESHMAN,
        aspiredPosition: user.aspiredPosition || '',
        githubUrl: user.githubUrl || '',
        linkedinUrl: user.linkedinUrl || '',
        twitterUrl: user.twitterUrl || '',
        technologySkills: user.technologySkills || []
      });
    }

    // Cleanup function to revoke blob URLs
    return () => {
      if (profilePictureUrl && profilePictureUrl.startsWith('blob:')) {
        URL.revokeObjectURL(profilePictureUrl);
      }
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-renders

  const loadFileUrls = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load profile picture URL if available
      if (user.profilePictureId) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          const response = await fetch(`${baseUrl}/api/files/${user.profilePictureId}`, {
            credentials: 'include',
            headers: {
              'Accept': 'image/*'
            }
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            console.log('Setting profile picture blob URL:', blobUrl);
            setProfilePictureUrl(blobUrl);
          } else {
            console.error('Failed to fetch profile picture:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('Failed to load profile picture:', error);
        }
      } else {
        console.log('No profile picture ID found');
      }

      // Load resume URL if available
      if (user.resumeId) {
        try {
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          const resumeFileUrl = `${baseUrl}/api/files/${user.resumeId}`;
          console.log('Setting resume URL:', resumeFileUrl);
          setResumeUrl(resumeFileUrl);
        } catch (error) {
          console.error('Failed to load resume:', error);
        }
      } else {
        console.log('No resume ID found');
      }
    } catch (error) {
      console.error('Error loading file URLs:', error);
      setError('Failed to load profile files');
    } finally {
      setLoading(false);
    }
  };

  const getUserTechnologies = () => {
    if (!user?.technologySkills) return [];
    
    return user.technologySkills
      .map(skillId => PREDEFINED_TECHNOLOGIES.find(tech => tech.id === skillId))
      .filter(Boolean);
  };

  const getTechnologiesByCategory = () => {
    const technologies = getUserTechnologies();
    const grouped: Record<TechnologyCategory, typeof technologies> = {
      [TechnologyCategory.LANGUAGE]: [],
      [TechnologyCategory.FRAMEWORK]: [],
      [TechnologyCategory.DATABASE]: [],
      [TechnologyCategory.TOOL]: [],
      [TechnologyCategory.CLOUD]: [],
      [TechnologyCategory.OTHER]: [],
    };

    technologies.forEach(tech => {
      if (tech) {
        grouped[tech.category].push(tech);
      }
    });

    return grouped;
  };

  const formatUniversityLevel = (level?: string) => {
    if (!level) return '';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  };

  const handleSocialLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data to current user data when canceling
      setEditFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        major: user?.major || '',
        universityLevel: user?.universityLevel || UniversityLevel.FRESHMAN,
        aspiredPosition: user?.aspiredPosition || '',
        githubUrl: user?.githubUrl || '',
        linkedinUrl: user?.linkedinUrl || '',
        twitterUrl: user?.twitterUrl || '',
        technologySkills: user?.technologySkills || []
      });
    }
    setIsEditing(!isEditing);
    setError(null);
  };

  const handleCancelEdit = () => {
    // Reset form data to current user data when canceling
    setEditFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      major: user?.major || '',
      universityLevel: user?.universityLevel || UniversityLevel.FRESHMAN,
      aspiredPosition: user?.aspiredPosition || '',
      githubUrl: user?.githubUrl || '',
      linkedinUrl: user?.linkedinUrl || '',
      twitterUrl: user?.twitterUrl || '',
      technologySkills: user?.technologySkills || []
    });
    setIsEditing(false);
    setError(null);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      setSaveLoading(true);
      setError(null);

      const response = await apiClient.user.updateProfile({
        ...editFormData,
        rNumber: user.rNumber // Keep existing R Number
      });

      if (response.data.success) {
        await refreshUser();
        setIsEditing(false);
      } else {
        setError(response.data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialLinksChange = (links: { githubUrl?: string; linkedinUrl?: string; twitterUrl?: string }) => {
    setEditFormData(prev => ({
      ...prev,
      ...links
    }));
  };

  const handleTechnologyChange = (technologies: string[]) => {
    setEditFormData(prev => ({
      ...prev,
      technologySkills: technologies
    }));
  };

  const handleFileUpload = async (file: File, type: 'profile-picture' | 'resume') => {
    try {
      console.log('File upload started - type:', type, 'file:', file.name);
      setLoading(true);
      
      if (type === 'profile-picture') {
        console.log('Uploading profile picture...');
        const response = await apiClient.files.uploadProfilePicture(file);
        console.log('Profile picture upload response:', response.data);
        if (response.data.success) {
          console.log('Profile picture upload successful, refreshing user...');
          await refreshUser();
          console.log('User refreshed, loading file URLs...');
          await loadFileUrls();
        } else {
          console.log('Profile picture upload failed:', response.data);
          setError('Profile picture upload failed');
        }
      } else if (type === 'resume') {
        console.log('Uploading resume...');
        const response = await apiClient.files.uploadResume(file);
        console.log('Resume upload response:', response.data);
        if (response.data.success) {
          console.log('Resume upload successful, refreshing user...');
          await refreshUser();
          console.log('User refreshed, loading file URLs...');
          await loadFileUrls();
        } else {
          console.log('Resume upload failed:', response.data);
          setError('Resume upload failed');
        }
      }
    } catch (error) {
      console.error('File upload failed:', error);
      setError('File upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileRemove = (type: 'profile-picture' | 'resume') => {
    // This would need to be implemented on the backend
    console.log('Remove file:', type);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation showAuthButtons={true} />
        
        <div className="flex items-center justify-center pt-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Please log in to view your profile.</p>
            <div className="space-x-4">
              <a
                href="/"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
              >
                Go to Home
              </a>
              <a
                href="/login"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md text-sm font-medium transition-colors"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const technologiesByCategory = getTechnologiesByCategory();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation showAuthButtons={true} />

      {/* Header with profile actions */}
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
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Actions */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
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
                onClick={handleCancelEdit}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

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
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file, 'profile-picture');
                          }}
                        />
                        Change Photo
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
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        placeholder="First Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                      <input
                        type="text"
                        value={editFormData.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        placeholder="Last Name"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <input
                      type="text"
                      value={editFormData.aspiredPosition}
                      onChange={(e) => handleFormChange('aspiredPosition', e.target.value)}
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
                            onChange={(e) => handleFormChange('major', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-medium text-gray-700">University Level</label>
                          <select
                            value={editFormData.universityLevel}
                            onChange={(e) => handleFormChange('universityLevel', e.target.value as UniversityLevel)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value={UniversityLevel.FRESHMAN}>Freshman</option>
                            <option value={UniversityLevel.SOPHOMORE}>Sophomore</option>
                            <option value={UniversityLevel.JUNIOR}>Junior</option>
                            <option value={UniversityLevel.SENIOR}>Senior</option>
                            <option value={UniversityLevel.GRADUATE}>Graduate</option>
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Major:</span>
                          <span className="text-sm font-medium text-gray-900">{user.major}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Level:</span>
                          <span className="text-sm font-medium text-gray-900">{formatUniversityLevel(user.universityLevel)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">R Number:</span>
                      <span className="text-sm font-medium text-gray-900">{user.rNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Email:</span>
                      <span className="text-sm font-medium text-gray-900">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Social Links</h3>
                  {isEditing ? (
                    <SocialMediaLinks
                      links={{
                        githubUrl: editFormData.githubUrl,
                        linkedinUrl: editFormData.linkedinUrl,
                        twitterUrl: editFormData.twitterUrl
                      }}
                      onChange={handleSocialLinksChange}
                      errors={{}}
                    />
                  ) : (
                    <div className="space-y-2">
                      {user.githubUrl && (
                        <button
                          onClick={() => handleSocialLinkClick(user.githubUrl!)}
                          className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <span className="text-sm text-gray-900">GitHub</span>
                        </button>
                      )}
                      {user.linkedinUrl && (
                        <button
                          onClick={() => handleSocialLinkClick(user.linkedinUrl!)}
                          className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span className="text-sm text-gray-900">LinkedIn</span>
                        </button>
                      )}
                      {user.twitterUrl && (
                        <button
                          onClick={() => handleSocialLinkClick(user.twitterUrl!)}
                          className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                          </svg>
                          <span className="text-sm text-gray-900">X (Twitter)</span>
                        </button>
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
                    <FileUpload
                      type="resume"
                      onUpload={(file) => handleFileUpload(file, 'resume')}
                      onRemove={() => handleFileRemove('resume')}
                      currentFile={resumeUrl || undefined}
                      loading={loading}
                    />
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

          {/* Technology Skills */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Technology Skills</h2>
                {!isEditing && getUserTechnologies().length > 0 && (
                  <span className="text-sm text-gray-500">
                    {getUserTechnologies().length} skill{getUserTechnologies().length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              {isEditing ? (
                <TechnologySelector
                  selectedTechnologies={editFormData.technologySkills}
                  onSelectionChange={handleTechnologyChange}
                  availableTechnologies={PREDEFINED_TECHNOLOGIES}
                />
              ) : getUserTechnologies().length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No skills added yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click "Edit Profile" to add your technology skills.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(technologiesByCategory).map(([category, techs]) => {
                    if (techs.length === 0) return null;
                    
                    return (
                      <div key={category}>
                        <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${CATEGORY_COLORS[category as TechnologyCategory].split(' ')[0]}`}></span>
                          {CATEGORY_LABELS[category as TechnologyCategory]}
                          <span className="ml-2 text-sm text-gray-500">({techs.length})</span>
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {techs.map((tech) => (
                            <span
                              key={tech!.id}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${CATEGORY_COLORS[tech!.category]} hover:shadow-md transition-shadow cursor-default`}
                              title={`${tech!.name} - ${CATEGORY_LABELS[tech!.category]}`}
                            >
                              {tech!.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;