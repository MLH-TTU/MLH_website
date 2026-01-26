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
  technologySkills?: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

// Onboarding form types
export interface OnboardingFormData {
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
  profilePicture?: File;
  resume?: File;
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

// Technology types
export interface Technology {
  id: string;
  name: string;
  category: TechnologyCategory;
  iconUrl?: string;
  color?: string;
}

// Component prop types
export interface AuthProviderButtonProps {
  provider: 'google' | 'microsoft' | 'email';
  onAuth: (provider: string) => void;
  disabled?: boolean;
}

export interface MagicLinkFormProps {
  onSubmit: (email: string) => void;
  loading?: boolean;
  error?: string;
}

export interface OnboardingFormProps {
  onSubmit: (data: OnboardingFormData) => void;
  onDuplicateDetected: (existingAccount: User) => void;
  loading?: boolean;
  errors?: Record<string, string>;
}

export interface TechnologySelectorProps {
  selectedTechnologies: string[];
  onSelectionChange: (technologies: string[]) => void;
  availableTechnologies: Technology[];
}

export interface SocialMediaLinksProps {
  links: {
    githubUrl?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
  };
  onChange: (links: { githubUrl?: string; linkedinUrl?: string; twitterUrl?: string }) => void;
  errors?: Record<string, string>;
}

export interface FileUploadProps {
  type: 'profile-picture' | 'resume';
  onUpload: (file: File) => void;
  onRemove: () => void;
  currentFile?: string;
  loading?: boolean;
  error?: string;
}

export interface AccountLinkingModalProps {
  existingAccount: User;
  onLinkAccount: (method: 'password' | 'reset', password?: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Duplicate detection response types
export interface DuplicateDetectionResponse {
  isDuplicate: boolean;
  existingAccount?: User;
  linkingToken?: string;
}

// Account linking response types
export interface AccountLinkingResponse {
  success: boolean;
  user?: User;
  message?: string;
}