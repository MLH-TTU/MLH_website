// Authentication types
export enum AuthProvider {
  GOOGLE = 'GOOGLE',
  MICROSOFT = 'MICROSOFT',
  EMAIL = 'EMAIL'
}

export enum UniversityLevel {
  FRESHMAN = 'FRESHMAN',
  SOPHOMORE = 'SOPHOMORE',
  JUNIOR = 'JUNIOR',
  SENIOR = 'SENIOR',
  GRADUATE = 'GRADUATE'
}

export enum TechnologyCategory {
  LANGUAGE = 'LANGUAGE',
  FRAMEWORK = 'FRAMEWORK',
  DATABASE = 'DATABASE',
  TOOL = 'TOOL',
  CLOUD = 'CLOUD',
  OTHER = 'OTHER'
}

export enum FileType {
  PROFILE_PICTURE = 'PROFILE_PICTURE',
  RESUME = 'RESUME'
}

// User types
export interface User {
  id: string;
  email: string;
  provider: AuthProvider;
  hasCompletedOnboarding: boolean;
  firstName?: string;
  lastName?: string;
  major?: string;
  rNumber?: string;
  universityLevel?: UniversityLevel;
  aspiredPosition?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  profilePictureId?: string;
  resumeId?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

// Onboarding types
export interface OnboardingData {
  firstName: string;
  lastName: string;
  major: string;
  rNumber: string;
  universityLevel: UniversityLevel;
  aspiredPosition: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  technologySkills: string[];
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// File upload types
export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

// Session types
export interface SessionData {
  userId: string;
  email: string;
  provider: AuthProvider;
  hasCompletedOnboarding: boolean;
}

// Technology types
export interface Technology {
  id: string;
  name: string;
  category: TechnologyCategory;
  iconUrl?: string;
  color?: string;
}

// Social media URL types
export interface SocialMediaUrls {
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
}