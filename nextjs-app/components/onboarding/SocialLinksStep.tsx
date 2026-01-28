'use client';

import { useState } from 'react';
import { z } from 'zod';

// Validation schema for social links
const socialLinksSchema = z.object({
  githubUrl: z.string().url('Invalid GitHub URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  twitterUrl: z.string().url('Invalid Twitter URL').optional().or(z.literal('')),
});

export type SocialLinksData = z.infer<typeof socialLinksSchema>;

interface SocialLinksStepProps {
  data: Partial<SocialLinksData>;
  onNext: (data: SocialLinksData) => void;
  onBack: () => void;
}

export default function SocialLinksStep({ data, onNext, onBack }: SocialLinksStepProps) {
  const [formData, setFormData] = useState<Partial<SocialLinksData>>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = socialLinksSchema.parse(formData);
      setErrors({});
      onNext(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const handleChange = (field: keyof SocialLinksData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Social Links</h2>
        <p className="text-gray-600 dark:text-gray-300">Connect your social profiles (all optional)</p>
      </div>

      <div>
        <label htmlFor="githubUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          GitHub URL
        </label>
        <input
          type="url"
          id="githubUrl"
          placeholder="https://github.com/username"
          value={formData.githubUrl || ''}
          onChange={(e) => handleChange('githubUrl', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.githubUrl ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.githubUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.githubUrl}</p>
        )}
      </div>

      <div>
        <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          LinkedIn URL
        </label>
        <input
          type="url"
          id="linkedinUrl"
          placeholder="https://linkedin.com/in/username"
          value={formData.linkedinUrl || ''}
          onChange={(e) => handleChange('linkedinUrl', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.linkedinUrl ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.linkedinUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.linkedinUrl}</p>
        )}
      </div>

      <div>
        <label htmlFor="twitterUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
          Twitter URL
        </label>
        <input
          type="url"
          id="twitterUrl"
          placeholder="https://twitter.com/username"
          value={formData.twitterUrl || ''}
          onChange={(e) => handleChange('twitterUrl', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.twitterUrl ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.twitterUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.twitterUrl}</p>
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
