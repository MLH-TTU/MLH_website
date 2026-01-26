import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OnboardingFormData, OnboardingFormProps, UniversityLevel } from '../../types';
import SocialMediaLinks from './SocialMediaLinks';
import TechnologySelector from './TechnologySelector';
import FileUpload from './FileUpload';
import AccountLinkingModal from './AccountLinkingModal';
import { useIntegratedFlow } from '../../hooks/useIntegratedFlow';

// Validation schema for the onboarding form
const onboardingSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  major: z.string().min(1, 'Major is required').max(100, 'Major must be less than 100 characters'),
  rNumber: z.string()
    .min(1, 'R Number is required')
    .regex(/^R\d{8}$/, 'R Number must be in format R12345678'),
  universityLevel: z.nativeEnum(UniversityLevel, { errorMap: () => ({ message: 'Please select your university level' }) }),
  aspiredPosition: z.string().min(1, 'Aspired position is required').max(100, 'Aspired position must be less than 100 characters'),
  githubUrl: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    return /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9-]){0,38}[a-zA-Z0-9]?$/.test(val);
  }, 'Please enter a valid GitHub URL (e.g., https://github.com/username)'),
  linkedinUrl: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    return /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/.test(val);
  }, 'Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)'),
  twitterUrl: z.string().optional().refine((val) => {
    if (!val) return true; // Optional field
    return /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/.test(val);
  }, 'Please enter a valid X/Twitter URL (e.g., https://x.com/username)'),
  technologySkills: z.array(z.string()).default([]),
});

type FormData = z.infer<typeof onboardingSchema>;

const OnboardingForm: React.FC<OnboardingFormProps> = ({
  onSubmit: _onSubmit, // Legacy prop, now handled by integrated flow
  onDuplicateDetected: _onDuplicateDetected, // Legacy prop, now handled by integrated flow
  loading: _loading = false, // Legacy prop, now handled by integrated flow
  errors: _errors = {}, // Legacy prop, now handled by integrated flow
}) => {
  const {
    loading,
    error,
    success,
    duplicateAccount,
    submitOnboarding,
    handleAccountLinking,
    clearError,
    clearDuplicateAccount
  } = useIntegratedFlow();

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [resume, setResume] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      technologySkills: [],
    },
  });

  const watchedValues = watch();

  const onFormSubmit = async (data: FormData) => {
    clearError();
    
    const onboardingData = {
      firstName: data.firstName,
      lastName: data.lastName,
      major: data.major,
      rNumber: data.rNumber,
      universityLevel: data.universityLevel,
      aspiredPosition: data.aspiredPosition,
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      twitterUrl: data.twitterUrl,
      technologySkills: data.technologySkills || [],
      profilePicture: profilePicture || undefined,
      resume: resume || undefined,
    };

    await submitOnboarding(onboardingData);
  };

  const handleSocialLinksChange = (links: { githubUrl?: string; linkedinUrl?: string; twitterUrl?: string }) => {
    setValue('githubUrl', links.githubUrl || '');
    setValue('linkedinUrl', links.linkedinUrl || '');
    setValue('twitterUrl', links.twitterUrl || '');
  };

  const handleTechnologyChange = (technologies: string[]) => {
    setValue('technologySkills', technologies);
  };

  const handleProfilePictureUpload = (file: File | null) => {
    setProfilePicture(file);
  };

  const handleResumeUpload = (file: File | null) => {
    setResume(file);
  };

  return (
    <>
      <form 
        onSubmit={handleSubmit(onFormSubmit)} 
        className="space-y-6"
        role="form"
        aria-label="Complete your MLH TTU profile"
        noValidate
      >
        {/* Error message */}
        {error && (
          <div 
            className="rounded-md bg-red-50 p-4"
            role="alert"
            aria-live="polite"
          >
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div 
            className="rounded-md bg-green-50 p-4"
            role="alert"
            aria-live="polite"
          >
            <div className="text-sm text-green-700">Profile completed successfully!</div>
          </div>
        )}

        {/* Basic Information Section */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-gray-900">Basic Information</legend>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                {...register('firstName')}
                type="text"
                id="firstName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your first name"
                aria-describedby={formErrors.firstName ? "firstName-error" : "firstName-help"}
                aria-invalid={!!formErrors.firstName}
                aria-required="true"
              />
              {formErrors.firstName && (
                <p 
                  id="firstName-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {formErrors.firstName.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                {...register('lastName')}
                type="text"
                id="lastName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your last name"
                aria-describedby={formErrors.lastName ? "lastName-error" : "lastName-help"}
                aria-invalid={!!formErrors.lastName}
                aria-required="true"
              />
              {formErrors.lastName && (
                <p 
                  id="lastName-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {formErrors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Major */}
          <div>
            <label htmlFor="major" className="block text-sm font-medium text-gray-700">
              Major *
            </label>
            <input
              {...register('major')}
              type="text"
              id="major"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Computer Science"
              aria-describedby={formErrors.major ? "major-error" : "major-help"}
              aria-invalid={!!formErrors.major}
              aria-required="true"
            />
            {formErrors.major && (
              <p 
                id="major-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {formErrors.major.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* R Number */}
            <div>
              <label htmlFor="rNumber" className="block text-sm font-medium text-gray-700">
                TTU R Number *
              </label>
              <input
                {...register('rNumber')}
                type="text"
                id="rNumber"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="R12345678"
                aria-describedby={formErrors.rNumber ? "rNumber-error" : "rNumber-help"}
                aria-invalid={!!formErrors.rNumber}
                aria-required="true"
              />
              {formErrors.rNumber && (
                <p 
                  id="rNumber-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {formErrors.rNumber.message}
                </p>
              )}
            </div>

            {/* University Level */}
            <div>
              <label htmlFor="universityLevel" className="block text-sm font-medium text-gray-700">
                University Level *
              </label>
              <select
                {...register('universityLevel')}
                id="universityLevel"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                aria-describedby={formErrors.universityLevel ? "universityLevel-error" : "universityLevel-help"}
                aria-invalid={!!formErrors.universityLevel}
                aria-required="true"
              >
                <option value="">Select your level</option>
                <option value={UniversityLevel.FRESHMAN}>Freshman</option>
                <option value={UniversityLevel.SOPHOMORE}>Sophomore</option>
                <option value={UniversityLevel.JUNIOR}>Junior</option>
                <option value={UniversityLevel.SENIOR}>Senior</option>
                <option value={UniversityLevel.GRADUATE}>Graduate</option>
              </select>
              {formErrors.universityLevel && (
                <p 
                  id="universityLevel-error"
                  className="mt-1 text-sm text-red-600"
                  role="alert"
                  aria-live="polite"
                >
                  {formErrors.universityLevel.message}
                </p>
              )}
            </div>
          </div>

          {/* Aspired Position */}
          <div>
            <label htmlFor="aspiredPosition" className="block text-sm font-medium text-gray-700">
              Aspired Position *
            </label>
            <input
              {...register('aspiredPosition')}
              type="text"
              id="aspiredPosition"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Software Engineer, Data Scientist"
              aria-describedby={formErrors.aspiredPosition ? "aspiredPosition-error" : "aspiredPosition-help"}
              aria-invalid={!!formErrors.aspiredPosition}
              aria-required="true"
            />
            {formErrors.aspiredPosition && (
              <p 
                id="aspiredPosition-error"
                className="mt-1 text-sm text-red-600"
                role="alert"
                aria-live="polite"
              >
                {formErrors.aspiredPosition.message}
              </p>
            )}
          </div>
        </fieldset>

        {/* Social Media Links */}
        <SocialMediaLinks
          links={{
            githubUrl: watchedValues.githubUrl,
            linkedinUrl: watchedValues.linkedinUrl,
            twitterUrl: watchedValues.twitterUrl,
          }}
          onChange={handleSocialLinksChange}
          errors={{
            githubUrl: formErrors.githubUrl?.message,
            linkedinUrl: formErrors.linkedinUrl?.message,
            twitterUrl: formErrors.twitterUrl?.message,
          }}
        />

        {/* Technology Skills */}
        <TechnologySelector
          selectedTechnologies={watchedValues.technologySkills || []}
          onSelectionChange={handleTechnologyChange}
        />

        {/* File Uploads */}
        <fieldset className="space-y-4">
          <legend className="text-lg font-medium text-gray-900">Optional Files</legend>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FileUpload
              type="profile-picture"
              onUpload={handleProfilePictureUpload}
              onRemove={() => handleProfilePictureUpload(null)}
              currentFile={profilePicture?.name}
            />
            
            <FileUpload
              type="resume"
              onUpload={handleResumeUpload}
              onRemove={() => handleResumeUpload(null)}
              currentFile={resume?.name}
            />
          </div>
        </fieldset>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-describedby="submit-help"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Completing Profile...
              </>
            ) : (
              'Complete Profile'
            )}
          </button>
        </div>
      </form>

      {/* Account Linking Modal */}
      {duplicateAccount && (
        <AccountLinkingModal
          existingAccount={duplicateAccount.existingUser}
          onLinkAccount={handleAccountLinking}
          onCancel={clearDuplicateAccount}
          loading={loading}
        />
      )}
    </>
  );
};

export default OnboardingForm;