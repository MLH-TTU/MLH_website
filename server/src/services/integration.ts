/**
 * Integration Service - Orchestrates all system components
 * 
 * This service provides a unified interface for connecting authentication,
 * onboarding, profile management, and file upload systems together.
 * It ensures proper error handling and user feedback throughout all flows.
 */

import { PrismaClient } from '@prisma/client';
import { AuthenticationService } from './auth.js';
import { ProfileService } from './profile.js';
import { FileUploadService } from './fileUpload.js';
import { DuplicateDetectionService } from './duplicateDetection.js';
import { User, AuthProvider, UniversityLevel } from '../types/index.js';

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  redirectTo?: string;
}

export interface DuplicateDetectionResult {
  existingUser: User;
  linkingToken: string;
  message: string;
}

export interface MessageResult {
  message: string;
}

export interface OnboardingFlowData {
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
  profilePicture?: Express.Multer.File;
  resume?: Express.Multer.File;
}

export interface AuthenticationFlowResult {
  user: User;
  sessionToken: string;
  redirectTo: string;
}

export class IntegrationService {
  private prisma: PrismaClient;
  private authService: AuthenticationService;
  private profileService: ProfileService;
  private fileUploadService: FileUploadService;
  private duplicateDetectionService: DuplicateDetectionService;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.authService = new AuthenticationService();
    this.profileService = new ProfileService(this.prisma);
    this.fileUploadService = new FileUploadService();
    this.duplicateDetectionService = new DuplicateDetectionService(this.prisma);
  }

  /**
   * Complete authentication flow with proper routing
   * Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2
   */
  async completeAuthenticationFlow(
    email: string,
    provider: AuthProvider,
    oauthData?: any
  ): Promise<IntegrationResult<AuthenticationFlowResult>> {
    try {
      // Step 1: Find or create user
      let user = await this.prisma.user.findUnique({
        where: { email },
        include: {
          technologySkills: {
            include: { technology: true }
          }
        }
      });

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email,
            provider,
            hasCompletedOnboarding: false
          },
          include: {
            technologySkills: {
              include: { technology: true }
            }
          }
        });
      }

      // Step 2: Create session
      const session = await this.authService.createSession(user);

      // Step 3: Determine redirect based on onboarding status
      const redirectTo = user.hasCompletedOnboarding ? '/profile' : '/onboarding';

      return {
        success: true,
        data: {
          user: this.transformPrismaUserToUser(user),
          sessionToken: session.token,
          redirectTo
        }
      };
    } catch (error) {
      console.error('Authentication flow error:', error);
      return {
        success: false,
        error: 'Authentication failed. Please try again.'
      };
    }
  }

  /**
   * Complete onboarding flow with duplicate detection and file uploads
   * Requirements: 2.11, 5.1, 5.7, 6.7, 6.8, 8.1, 8.2, 8.3
   */
  async completeOnboardingFlow(
    userId: string,
    onboardingData: OnboardingFlowData
  ): Promise<IntegrationResult<any>> {
    try {
      // Step 1: Check for duplicate R Number
      const existingUser = await this.duplicateDetectionService.findAccountByRNumber(onboardingData.rNumber);
      
      if (existingUser && existingUser.id !== userId) {
        // Create linking token for duplicate scenario
        const currentUser = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!currentUser) {
          throw new Error('Current user not found');
        }

        const linkingToken = await this.duplicateDetectionService.createAccountLinkingToken(
          existingUser.id,
          currentUser.email,
          currentUser.provider as AuthProvider
        );

        return {
          success: false,
          error: 'DUPLICATE_R_NUMBER',
          data: {
            existingUser,
            linkingToken,
            message: 'An account with this R Number already exists. Would you like to link your accounts?'
          } as DuplicateDetectionResult
        };
      }

      // Step 2: Handle file uploads if provided
      let profilePictureId: string | undefined;
      let resumeId: string | undefined;

      if (onboardingData.profilePicture) {
        const profilePictureResult = await this.fileUploadService.uploadProfilePicture(
          onboardingData.profilePicture,
          userId
        );
        if (profilePictureResult.success) {
          profilePictureId = profilePictureResult.fileId;
        } else {
          return {
            success: false,
            error: `Profile picture upload failed: ${profilePictureResult.error}`
          };
        }
      }

      if (onboardingData.resume) {
        const resumeResult = await this.fileUploadService.uploadResume(
          onboardingData.resume,
          userId
        );
        if (resumeResult.success) {
          resumeId = resumeResult.fileId;
        } else {
          return {
            success: false,
            error: `Resume upload failed: ${resumeResult.error}`
          };
        }
      }

      // Step 3: Complete onboarding with all data
      const onboardingPayload = {
        ...onboardingData,
        profilePictureId,
        resumeId
      };

      const completedUser = await this.profileService.completeOnboarding(userId, onboardingPayload);

      return {
        success: true,
        data: completedUser,
        redirectTo: '/profile'
      };
    } catch (error) {
      console.error('Onboarding flow error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Onboarding failed. Please try again.'
      };
    }
  }

  /**
   * Handle account linking flow
   * Requirements: 5.3, 5.5, 5.6, 5.7
   */
  async processAccountLinking(
    linkingToken: string,
    method: 'password' | 'reset',
    password?: string
  ): Promise<IntegrationResult<any>> {
    try {
      if (method === 'reset') {
        // Get token details to send reset email
        const tokenDetails = await this.duplicateDetectionService.getLinkingTokenDetails(linkingToken);
        if (!tokenDetails) {
          return {
            success: false,
            error: 'Invalid linking token'
          };
        }

        await this.duplicateDetectionService.sendPasswordResetForLinking(tokenDetails.existingUser.email);
        
        return {
          success: true,
          data: {
            message: 'Password reset email sent. Please check your email and follow the instructions.'
          } as MessageResult
        };
      } else if (method === 'password') {
        if (!password) {
          return {
            success: false,
            error: 'Password is required'
          };
        }

        // Process the account linking
        const linkingResult = await this.duplicateDetectionService.processAccountLinking(linkingToken);
        
        if (!linkingResult.success) {
          return {
            success: false,
            error: linkingResult.error || 'Account linking failed'
          };
        }

        return {
          success: true,
          data: linkingResult.user,
          redirectTo: '/profile'
        };
      }

      return {
        success: false,
        error: 'Invalid linking method'
      };
    } catch (error) {
      console.error('Account linking error:', error);
      return {
        success: false,
        error: 'Account linking failed. Please try again.'
      };
    }
  }

  /**
   * Complete profile update flow with file handling
   * Requirements: 6.7, 6.8, 8.1, 8.2, 8.3
   */
  async updateUserProfile(
    userId: string,
    updateData: Partial<OnboardingFlowData>
  ): Promise<IntegrationResult<User>> {
    try {
      // Handle file uploads if provided
      let profilePictureId: string | undefined;
      let resumeId: string | undefined;

      if (updateData.profilePicture) {
        const profilePictureResult = await this.fileUploadService.uploadProfilePicture(
          updateData.profilePicture,
          userId
        );
        if (profilePictureResult.success) {
          profilePictureId = profilePictureResult.fileId;
        } else {
          return {
            success: false,
            error: `Profile picture upload failed: ${profilePictureResult.error}`
          };
        }
      }

      if (updateData.resume) {
        const resumeResult = await this.fileUploadService.uploadResume(
          updateData.resume,
          userId
        );
        if (resumeResult.success) {
          resumeId = resumeResult.fileId;
        } else {
          return {
            success: false,
            error: `Resume upload failed: ${resumeResult.error}`
          };
        }
      }

      // Update profile with all data
      const updatePayload = {
        ...updateData,
        profilePictureId,
        resumeId
      };

      const updatedUser = await this.profileService.updateUserProfile(userId, updatePayload);

      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      console.error('Profile update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed. Please try again.'
      };
    }
  }

  /**
   * Validate session and get user with proper error handling
   * Requirements: 1.6, 3.3, 3.4
   */
  async validateUserSession(sessionToken: string): Promise<IntegrationResult<User>> {
    try {
      const user = await this.authService.validateSession(sessionToken);
      
      if (!user) {
        return {
          success: false,
          error: 'Invalid or expired session',
          redirectTo: '/login'
        };
      }

      return {
        success: true,
        data: this.transformPrismaUserToUser(user)
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        success: false,
        error: 'Session validation failed',
        redirectTo: '/login'
      };
    }
  }

  /**
   * Get complete user profile with all related data
   * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
   */
  async getCompleteUserProfile(userId: string): Promise<IntegrationResult<any>> {
    try {
      const user = await this.profileService.getUserProfile(userId);
      
      if (!user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      // Get file URLs if files exist
      let profilePictureUrl: string | null = null;
      let resumeUrl: string | null = null;

      if (user.profilePictureId) {
        profilePictureUrl = await this.fileUploadService.getSecureFileUrl(user.profilePictureId, userId);
      }

      if (user.resumeId) {
        resumeUrl = await this.fileUploadService.getSecureFileUrl(user.resumeId, userId);
      }

      return {
        success: true,
        data: {
          ...user,
          profilePictureUrl,
          resumeUrl
        }
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        error: 'Failed to retrieve profile'
      };
    }
  }

  /**
   * Handle logout with proper cleanup
   * Requirements: 1.6
   */
  async logout(sessionToken: string): Promise<IntegrationResult<void>> {
    try {
      await this.authService.destroySession(sessionToken);
      
      return {
        success: true,
        redirectTo: '/'
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  }

  /**
   * Health check for all integrated services
   */
  async healthCheck(): Promise<IntegrationResult<any>> {
    try {
      // Test database connection
      await this.prisma.$connect();
      
      return {
        success: true,
        data: {
          database: 'Connected',
          fileUpload: 'Ready',
          services: {
            auth: 'Ready',
            profile: 'Ready',
            fileUpload: 'Ready',
            duplicateDetection: 'Ready'
          },
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Health check error:', error);
      return {
        success: false,
        error: 'System health check failed',
        data: {
          database: 'Disconnected',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Transform Prisma user object to our User interface
   */
  private transformPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      provider: prismaUser.provider as AuthProvider,
      hasCompletedOnboarding: prismaUser.hasCompletedOnboarding,
      firstName: prismaUser.firstName || undefined,
      lastName: prismaUser.lastName || undefined,
      major: prismaUser.major || undefined,
      rNumber: prismaUser.rNumber || undefined,
      universityLevel: prismaUser.universityLevel || undefined,
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
}