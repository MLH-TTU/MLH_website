import React from 'react';
import { SocialMediaLinksProps } from '../../types';

const SocialMediaLinks: React.FC<SocialMediaLinksProps> = ({
  links,
  onChange,
  errors = {},
}) => {
  const handleInputChange = (field: keyof typeof links, value: string) => {
    onChange({ ...links, [field]: value });
  };

  const getFieldError = (field: string) => {
    return errors[field] || null;
  };

  return (
    <fieldset className="space-y-4">
      <legend className="text-lg font-medium text-gray-900">Social Media Links (Optional)</legend>
      <p className="text-sm text-gray-600">
        Connect your social profiles to showcase your work and connect with other members.
      </p>
      
      {/* GitHub URL */}
      <div>
        <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700">
          GitHub Profile
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </div>
          <input
            type="url"
            id="githubUrl"
            value={links.githubUrl || ''}
            onChange={(e) => handleInputChange('githubUrl', e.target.value)}
            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              getFieldError('githubUrl') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="https://github.com/yourusername"
            aria-describedby={getFieldError('githubUrl') ? 'githubUrl-error' : 'githubUrl-help'}
            aria-invalid={!!getFieldError('githubUrl')}
          />
        </div>
        {getFieldError('githubUrl') && (
          <p 
            id="githubUrl-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {getFieldError('githubUrl')}
          </p>
        )}
        <p id="githubUrl-help" className="mt-1 text-xs text-gray-500">
          Example: https://github.com/yourusername
        </p>
      </div>

      {/* LinkedIn URL */}
      <div>
        <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700">
          LinkedIn Profile
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </div>
          <input
            type="url"
            id="linkedinUrl"
            value={links.linkedinUrl || ''}
            onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              getFieldError('linkedinUrl') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="https://linkedin.com/in/yourusername"
            aria-describedby={getFieldError('linkedinUrl') ? 'linkedinUrl-error' : 'linkedinUrl-help'}
            aria-invalid={!!getFieldError('linkedinUrl')}
          />
        </div>
        {getFieldError('linkedinUrl') && (
          <p 
            id="linkedinUrl-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {getFieldError('linkedinUrl')}
          </p>
        )}
        <p id="linkedinUrl-help" className="mt-1 text-xs text-gray-500">
          Example: https://linkedin.com/in/yourusername
        </p>
      </div>

      {/* Twitter/X URL */}
      <div>
        <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700">
          X (Twitter) Profile
        </label>
        <div className="mt-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </div>
          <input
            type="url"
            id="twitterUrl"
            value={links.twitterUrl || ''}
            onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
            className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
              getFieldError('twitterUrl') ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="https://x.com/yourusername"
            aria-describedby={getFieldError('twitterUrl') ? 'twitterUrl-error' : 'twitterUrl-help'}
            aria-invalid={!!getFieldError('twitterUrl')}
          />
        </div>
        {getFieldError('twitterUrl') && (
          <p 
            id="twitterUrl-error"
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {getFieldError('twitterUrl')}
          </p>
        )}
        <p id="twitterUrl-help" className="mt-1 text-xs text-gray-500">
          Example: https://x.com/yourusername or https://twitter.com/yourusername
        </p>
      </div>
    </fieldset>
  );
};

export default SocialMediaLinks;