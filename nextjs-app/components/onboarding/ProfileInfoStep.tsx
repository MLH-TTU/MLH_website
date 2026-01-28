'use client';

import { useState } from 'react';
import { z } from 'zod';

// Validation schema for profile info
const profileInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  major: z.string().min(1, 'Major is required'),
  universityLevel: z.enum(['freshman', 'sophomore', 'junior', 'senior', 'graduate', 'other']),
  aspiredPosition: z.string().optional(),
});

export type ProfileInfoData = z.infer<typeof profileInfoSchema>;

interface ProfileInfoStepProps {
  data: Partial<ProfileInfoData>;
  onNext: (data: ProfileInfoData) => void;
}

export default function ProfileInfoStep({ data, onNext }: ProfileInfoStepProps) {
  const [formData, setFormData] = useState<Partial<ProfileInfoData>>(data);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = profileInfoSchema.parse(formData);
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

  const handleChange = (field: keyof ProfileInfoData, value: string) => {
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h2>
        <p className="text-gray-600">Tell us about yourself</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            value={formData.firstName || ''}
            onChange={(e) => handleChange('firstName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            value={formData.lastName || ''}
            onChange={(e) => handleChange('lastName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="major" className="block text-sm font-medium text-gray-700 mb-1">
          Major *
        </label>
        <input
          type="text"
          id="major"
          value={formData.major || ''}
          onChange={(e) => handleChange('major', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.major ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.major && (
          <p className="mt-1 text-sm text-red-600">{errors.major}</p>
        )}
      </div>

      <div>
        <label htmlFor="universityLevel" className="block text-sm font-medium text-gray-700 mb-1">
          University Level *
        </label>
        <select
          id="universityLevel"
          value={formData.universityLevel || ''}
          onChange={(e) => handleChange('universityLevel', e.target.value)}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
            errors.universityLevel ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select level</option>
          <option value="freshman">Freshman</option>
          <option value="sophomore">Sophomore</option>
          <option value="junior">Junior</option>
          <option value="senior">Senior</option>
          <option value="graduate">Graduate</option>
          <option value="other">Other</option>
        </select>
        {errors.universityLevel && (
          <p className="mt-1 text-sm text-red-600">{errors.universityLevel}</p>
        )}
      </div>

      <div>
        <label htmlFor="aspiredPosition" className="block text-sm font-medium text-gray-700 mb-1">
          Aspired Position (Optional)
        </label>
        <input
          type="text"
          id="aspiredPosition"
          placeholder="e.g., Software Engineer, Data Scientist"
          value={formData.aspiredPosition || ''}
          onChange={(e) => handleChange('aspiredPosition', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>

      <div className="flex justify-end">
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
