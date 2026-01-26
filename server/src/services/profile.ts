import { PrismaClient } from '@prisma/client';
import { 
  User, 
  OnboardingData, 
  ValidationResult, 
  ValidationError, 
  SocialMediaUrls,
  UniversityLevel 
} from '../types/index';
import { DuplicateDetectionService } from './duplicateDetection';

export class ProfileService {
  private prisma: PrismaClient;
  private duplicateDetectionService: DuplicateDetectionService;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.duplicateDetectionService = new DuplicateDetectionService(this.prisma);
  }

  /**
   * Check if R Number exists for duplicate detection
   * Requirements: 2.11, 5.1
   */
  async checkRNumberExists(rNumber: string, excludeUserId?: string): Promise<User | null> {
    return await this.duplicateDetectionService.checkRNumberExists(rNumber, excludeUserId);
  }

  /**
   * Link account by R Number for duplicate scenarios
   * Requirements: 5.7
   */
  async linkAccountByRNumber(rNumber: string, newEmail: string, newProvider: any): Promise<User> {
    return await this.duplicateDetectionService.linkAccountByRNumber(rNumber, newEmail, newProvider);
  }

  /**
   * Get user profile by user ID
   * Requirements: 6.1, 6.7
   */
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          technologySkills: {
            include: {
              technology: true
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      // Transform the user data to match our User interface
      return {
        id: user.id,
        email: user.email,
        provider: user.provider as any,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        major: user.major || undefined,
        rNumber: user.rNumber || undefined,
        universityLevel: user.universityLevel as any,
        aspiredPosition: user.aspiredPosition || undefined,
        githubUrl: user.githubUrl || undefined,
        linkedinUrl: user.linkedinUrl || undefined,
        twitterUrl: user.twitterUrl || undefined,
        profilePictureId: user.profilePictureId || undefined,
        resumeId: user.resumeId || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: user.lastLoginAt || undefined
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error('Failed to retrieve user profile');
    }
  }

  /**
   * Update user profile with partial data
   * Requirements: 6.8
   */
  async updateUserProfile(userId: string, data: Partial<OnboardingData>): Promise<User> {
    try {
      // Validate the update data
      const validation = this.validateProfileUpdateData(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Filter out empty strings to avoid overwriting existing data
      const updateData: any = {
        updatedAt: new Date()
      };

      if (data.firstName && data.firstName.trim()) updateData.firstName = data.firstName;
      if (data.lastName && data.lastName.trim()) updateData.lastName = data.lastName;
      if (data.major && data.major.trim()) updateData.major = data.major;
      if (data.rNumber && data.rNumber.trim()) updateData.rNumber = data.rNumber;
      if (data.universityLevel) updateData.universityLevel = data.universityLevel;
      if (data.aspiredPosition && data.aspiredPosition.trim()) updateData.aspiredPosition = data.aspiredPosition;
      if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl; // Allow empty string for clearing
      if (data.linkedinUrl !== undefined) updateData.linkedinUrl = data.linkedinUrl; // Allow empty string for clearing
      if (data.twitterUrl !== undefined) updateData.twitterUrl = data.twitterUrl; // Allow empty string for clearing

      // Update user profile
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          technologySkills: {
            include: {
              technology: true
            }
          }
        }
      });

      // Handle technology skills update if provided
      if (data.technologySkills) {
        await this.updateUserTechnologySkills(userId, data.technologySkills);
      }

      return this.transformPrismaUserToUser(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Complete user onboarding with full profile data
   * Requirements: 6.9
   */
  async completeOnboarding(userId: string, data: OnboardingData): Promise<User> {
    try {
      // Use comprehensive validation
      const validation = await this.validateAllUserInput(data);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      // Check if R Number already exists for a different user
      if (data.rNumber) {
        const existingUser = await this.checkRNumberExists(data.rNumber, userId);
        if (existingUser) {
          throw new Error('R Number already exists for another user');
        }
      }

      // Update user with onboarding data and mark as completed
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          major: data.major,
          rNumber: data.rNumber,
          universityLevel: data.universityLevel,
          aspiredPosition: data.aspiredPosition,
          githubUrl: data.githubUrl,
          linkedinUrl: data.linkedinUrl,
          twitterUrl: data.twitterUrl,
          hasCompletedOnboarding: true,
          updatedAt: new Date()
        }
      });

      // Update technology skills
      await this.updateUserTechnologySkills(userId, data.technologySkills);

      // Return the updated user with technology skills
      return await this.getUserProfile(userId) as User;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      throw error;
    }
  }

  /**
   * Update user's technology skills
   */
  private async updateUserTechnologySkills(userId: string, technologyIds: string[]): Promise<void> {
    try {
      // Remove existing technology skills
      await this.prisma.userTechnology.deleteMany({
        where: { userId }
      });

      // Add new technology skills
      if (technologyIds.length > 0) {
        const userTechnologies = technologyIds.map(technologyId => ({
          userId,
          technologyId
        }));

        await this.prisma.userTechnology.createMany({
          data: userTechnologies
        });
      }
    } catch (error) {
      console.error('Error updating user technology skills:', error);
      throw new Error('Failed to update technology skills');
    }
  }

  /**
   * Transform Prisma user object to our User interface
   */
  private transformPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      provider: prismaUser.provider,
      hasCompletedOnboarding: prismaUser.hasCompletedOnboarding,
      firstName: prismaUser.firstName || undefined,
      lastName: prismaUser.lastName || undefined,
      major: prismaUser.major || undefined,
      rNumber: prismaUser.rNumber || undefined,
      universityLevel: prismaUser.universityLevel,
      aspiredPosition: prismaUser.aspiredPosition || undefined,
      githubUrl: prismaUser.githubUrl || undefined,
      linkedinUrl: prismaUser.linkedinUrl || undefined,
      twitterUrl: prismaUser.twitterUrl || undefined,
      profilePictureId: prismaUser.profilePictureId || undefined,
      resumeId: prismaUser.resumeId || undefined,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      lastLoginAt: prismaUser.lastLoginAt || undefined
    };
  }

  /**
   * Validate onboarding data
   * Requirements: 6.1
   */
  validateOnboardingData(data: OnboardingData): ValidationResult {
    const errors: ValidationError[] = [];

    // Required fields validation
    if (!data.firstName || data.firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'First name is required' });
    }

    if (!data.lastName || data.lastName.trim().length === 0) {
      errors.push({ field: 'lastName', message: 'Last name is required' });
    }

    if (!data.major || data.major.trim().length === 0) {
      errors.push({ field: 'major', message: 'Major is required' });
    }

    if (!data.rNumber || data.rNumber.trim().length === 0) {
      errors.push({ field: 'rNumber', message: 'R Number is required' });
    }

    if (!data.universityLevel) {
      errors.push({ field: 'universityLevel', message: 'University level is required' });
    }

    if (!data.aspiredPosition || data.aspiredPosition.trim().length === 0) {
      errors.push({ field: 'aspiredPosition', message: 'Aspired position is required' });
    }

    // Validate university level enum
    if (data.universityLevel && !Object.values(UniversityLevel).includes(data.universityLevel)) {
      errors.push({ field: 'universityLevel', message: 'Invalid university level' });
    }

    // Validate social media URLs if provided
    const socialMediaValidation = this.validateSocialMediaUrls({
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      twitterUrl: data.twitterUrl
    });

    if (!socialMediaValidation.isValid) {
      errors.push(...socialMediaValidation.errors);
    }

    // Validate technology skills array
    if (!Array.isArray(data.technologySkills)) {
      errors.push({ field: 'technologySkills', message: 'Technology skills must be an array' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate profile update data (partial validation)
   */
  private validateProfileUpdateData(data: Partial<OnboardingData>): ValidationResult {
    const errors: ValidationError[] = [];

    // Only validate fields that have actual content (not empty strings)
    if (data.firstName && data.firstName.trim().length === 0) {
      errors.push({ field: 'firstName', message: 'First name cannot be empty' });
    }

    if (data.lastName && data.lastName.trim().length === 0) {
      errors.push({ field: 'lastName', message: 'Last name cannot be empty' });
    }

    if (data.major && data.major.trim().length === 0) {
      errors.push({ field: 'major', message: 'Major cannot be empty' });
    }

    if (data.rNumber && data.rNumber.trim().length === 0) {
      errors.push({ field: 'rNumber', message: 'R Number cannot be empty' });
    }

    if (data.aspiredPosition && data.aspiredPosition.trim().length === 0) {
      errors.push({ field: 'aspiredPosition', message: 'Aspired position cannot be empty' });
    }

    // Validate university level enum if provided
    if (data.universityLevel && !Object.values(UniversityLevel).includes(data.universityLevel)) {
      errors.push({ field: 'universityLevel', message: 'Invalid university level' });
    }

    // Validate social media URLs if provided
    const socialMediaValidation = this.validateSocialMediaUrls({
      githubUrl: data.githubUrl,
      linkedinUrl: data.linkedinUrl,
      twitterUrl: data.twitterUrl
    });

    if (!socialMediaValidation.isValid) {
      errors.push(...socialMediaValidation.errors);
    }

    // Validate technology skills array if provided
    if (data.technologySkills !== undefined && !Array.isArray(data.technologySkills)) {
      errors.push({ field: 'technologySkills', message: 'Technology skills must be an array' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate R Number format (TTU Student ID format)
   * Requirements: 4.4, 6.2
   */
  validateRNumberFormat(rNumber: string): ValidationResult {
    const errors: ValidationError[] = [];

    if (!rNumber || rNumber.trim().length === 0) {
      errors.push({ field: 'rNumber', message: 'R Number is required' });
      return { isValid: false, errors };
    }

    // TTU R Number format: R followed by 8 digits (e.g., R12345678)
    const rNumberPattern = /^R\d{8}$/;
    
    if (!rNumberPattern.test(rNumber.trim())) {
      errors.push({ 
        field: 'rNumber', 
        message: 'Invalid R Number format. Must be R followed by 8 digits (e.g., R12345678)' 
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate technology skills selection
   * Requirements: 4.10, 6.6
   */
  async validateTechnologySkillsSelection(technologyIds: string[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!Array.isArray(technologyIds)) {
      errors.push({ field: 'technologySkills', message: 'Technology skills must be an array' });
      return { isValid: false, errors };
    }

    if (technologyIds.length === 0) {
      // Technology skills are optional, so empty array is valid
      return { isValid: true, errors: [] };
    }

    try {
      // Check if all provided technology IDs exist in the database
      const existingTechnologies = await this.prisma.technology.findMany({
        where: {
          id: {
            in: technologyIds
          }
        },
        select: { id: true }
      });

      const existingIds = existingTechnologies.map(tech => tech.id);
      const invalidIds = technologyIds.filter(id => !existingIds.includes(id));

      if (invalidIds.length > 0) {
        errors.push({ 
          field: 'technologySkills', 
          message: `Invalid technology IDs: ${invalidIds.join(', ')}` 
        });
      }

      // Check for duplicates
      const uniqueIds = [...new Set(technologyIds)];
      if (uniqueIds.length !== technologyIds.length) {
        errors.push({ 
          field: 'technologySkills', 
          message: 'Duplicate technology skills are not allowed' 
        });
      }

    } catch (error) {
      console.error('Error validating technology skills:', error);
      errors.push({ 
        field: 'technologySkills', 
        message: 'Failed to validate technology skills' 
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Enhanced social media URL validation with platform-specific patterns
   * Requirements: 4.7, 4.8, 4.9, 6.3
   */
  validateSocialMediaUrls(urls: SocialMediaUrls): ValidationResult {
    const errors: ValidationError[] = [];

    // GitHub URL validation - more comprehensive pattern
    if (urls.githubUrl) {
      const githubPattern = /^https:\/\/(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9-]){0,38}$/;
      if (!githubPattern.test(urls.githubUrl.trim())) {
        errors.push({ 
          field: 'githubUrl', 
          message: 'Invalid GitHub URL format. Must be https://github.com/username (username 1-39 characters, alphanumeric and hyphens only)' 
        });
      }
    }

    // LinkedIn URL validation - supports both /in/ and /company/ formats
    if (urls.linkedinUrl) {
      const linkedinPattern = /^https:\/\/(www\.)?linkedin\.com\/(in|company)\/[a-zA-Z0-9-]+\/?$/;
      if (!linkedinPattern.test(urls.linkedinUrl.trim())) {
        errors.push({ 
          field: 'linkedinUrl', 
          message: 'Invalid LinkedIn URL format. Must be https://linkedin.com/in/username or https://linkedin.com/company/companyname' 
        });
      }
    }

    // Twitter/X URL validation - supports both domains
    if (urls.twitterUrl) {
      const twitterPattern = /^https:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]{1,15}\/?$/;
      if (!twitterPattern.test(urls.twitterUrl.trim())) {
        errors.push({ 
          field: 'twitterUrl', 
          message: 'Invalid Twitter/X URL format. Must be https://twitter.com/username or https://x.com/username (username 1-15 characters)' 
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Delete user account and all associated data
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Delete in order to respect foreign key constraints
      // First delete user technology skills
      await this.prisma.userTechnology.deleteMany({
        where: { userId }
      });

      // Delete user sessions
      await this.prisma.session.deleteMany({
        where: { userId }
      });

      // Delete account linking tokens
      await this.prisma.accountLinkingToken.deleteMany({
        where: { existingUserId: userId }
      });

      // Delete user files
      await this.prisma.file.deleteMany({
        where: { userId }
      });

      // Finally delete the user
      await this.prisma.user.delete({
        where: { id: userId }
      });
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw new Error('Failed to delete user account');
    }
  }

  /**
   * Comprehensive validation for all user input fields
   * Requirements: 4.2, 4.3, 4.4, 4.6, 6.1, 6.2, 6.3
   */
  async validateAllUserInput(data: OnboardingData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Basic required fields validation
    const basicValidation = this.validateOnboardingData(data);
    if (!basicValidation.isValid) {
      errors.push(...basicValidation.errors);
    }

    // R Number format validation
    if (data.rNumber) {
      const rNumberValidation = this.validateRNumberFormat(data.rNumber);
      if (!rNumberValidation.isValid) {
        errors.push(...rNumberValidation.errors);
      }
    }

    // Technology skills validation
    if (data.technologySkills) {
      const techValidation = await this.validateTechnologySkillsSelection(data.technologySkills);
      if (!techValidation.isValid) {
        errors.push(...techValidation.errors);
      }
    }

    // Additional field length validations
    if (data.firstName && data.firstName.length > 50) {
      errors.push({ field: 'firstName', message: 'First name must be 50 characters or less' });
    }

    if (data.lastName && data.lastName.length > 50) {
      errors.push({ field: 'lastName', message: 'Last name must be 50 characters or less' });
    }

    if (data.major && data.major.length > 100) {
      errors.push({ field: 'major', message: 'Major must be 100 characters or less' });
    }

    if (data.aspiredPosition && data.aspiredPosition.length > 100) {
      errors.push({ field: 'aspiredPosition', message: 'Aspired position must be 100 characters or less' });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}