import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';
import { User, AuthProvider } from '../types/index';
import * as nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

export interface AccountLinkResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class DuplicateDetectionService {
  private prisma: PrismaClient;
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
    this.configureEmailTransporter();
  }

  private configureEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (error) {
      // In test environment, email transporter might not be available
      console.warn('Email transporter not configured:', error);
      this.emailTransporter = null;
    }
  }

  /**
   * Find existing account by R Number
   * Requirements: 2.11, 5.1
   */
  async findAccountByRNumber(rNumber: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { rNumber },
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

      return this.transformPrismaUserToUser(user);
    } catch (error) {
      console.error('Error finding account by R Number:', error);
      throw new Error('Failed to check for existing account');
    }
  }

  /**
   * Check if R Number exists for a different user
   * Requirements: 2.11
   */
  async checkRNumberExists(rNumber: string, excludeUserId?: string): Promise<User | null> {
    try {
      const whereClause: any = { rNumber };
      
      if (excludeUserId) {
        whereClause.id = { not: excludeUserId };
      }

      const user = await this.prisma.user.findFirst({
        where: whereClause
      });

      return user ? this.transformPrismaUserToUser(user) : null;
    } catch (error) {
      console.error('Error checking R Number existence:', error);
      throw new Error('Failed to check R Number');
    }
  }

  /**
   * Create account linking token for duplicate scenarios
   * Requirements: 5.7
   */
  async createAccountLinkingToken(
    existingUserId: string, 
    newEmail: string, 
    newProvider: AuthProvider
  ): Promise<string> {
    try {
      // Generate secure random token
      const token = randomBytes(32).toString('hex');
      
      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Create linking token record
      await this.prisma.accountLinkingToken.create({
        data: {
          existingUserId,
          newEmail,
          newProvider,
          token,
          expiresAt,
          used: false
        }
      });

      return token;
    } catch (error) {
      console.error('Error creating account linking token:', error);
      throw new Error('Failed to create account linking token');
    }
  }

  /**
   * Link new email/provider to existing account by R Number
   * Requirements: 5.7
   */
  async linkAccountByRNumber(
    rNumber: string, 
    newEmail: string, 
    newProvider: AuthProvider,
    password?: string
  ): Promise<User> {
    try {
      // Find existing account by R Number
      const existingUser = await this.findAccountByRNumber(rNumber);
      
      if (!existingUser) {
        throw new Error('No existing account found with this R Number');
      }

      // If password is provided, validate it (simplified - in real app would hash/compare)
      if (password && password.length < 6) {
        throw new Error('Invalid password provided');
      }

      // Check if the new email already exists
      const emailExists = await this.prisma.user.findUnique({
        where: { email: newEmail }
      });

      if (emailExists && emailExists.id !== existingUser.id) {
        throw new Error('Email already exists for a different account');
      }

      // Update the existing user with new email and provider if different
      const updatedUser = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          email: newEmail,
          provider: newProvider,
          updatedAt: new Date()
        },
        include: {
          technologySkills: {
            include: {
              technology: true
            }
          }
        }
      });

      return this.transformPrismaUserToUser(updatedUser);
    } catch (error) {
      console.error('Error linking account by R Number:', error);
      throw error;
    }
  }

  /**
   * Send password reset link for account linking
   * Requirements: 5.5
   */
  async sendPasswordResetForLinking(email: string): Promise<void> {
    try {
      if (!this.emailTransporter) {
        // In test environment, just log instead of sending email
        console.log(`Would send password reset email to: ${email}`);
        return;
      }

      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal if email exists or not for security
        return;
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email, type: 'password-reset' },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const resetLink = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@mlhttu.com',
        to: email,
        subject: 'Password Reset for Account Linking - MLH TTU',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested a password reset to link your accounts. Click the link below to reset your password:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
              Reset Password
            </a>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, you can safely ignore this email.
            </p>
          </div>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  /**
   * Process account linking using token
   * Requirements: 5.7
   */
  async processAccountLinking(token: string): Promise<AccountLinkResult> {
    try {
      // Find and validate the linking token
      const linkingToken = await this.prisma.accountLinkingToken.findUnique({
        where: { token },
        include: {
          existingUser: true
        }
      });

      if (!linkingToken) {
        return {
          success: false,
          error: 'Invalid or expired linking token'
        };
      }

      // Check if token is expired
      if (linkingToken.expiresAt < new Date()) {
        return {
          success: false,
          error: 'Linking token has expired'
        };
      }

      // Check if token is already used
      if (linkingToken.used) {
        return {
          success: false,
          error: 'Linking token has already been used'
        };
      }

      // Link the accounts
      const linkedUser = await this.linkAccountByRNumber(
        linkingToken.existingUser.rNumber!,
        linkingToken.newEmail,
        linkingToken.newProvider as AuthProvider
      );

      // Mark token as used
      await this.prisma.accountLinkingToken.update({
        where: { token },
        data: { used: true }
      });

      return {
        success: true,
        user: linkedUser
      };
    } catch (error) {
      console.error('Error processing account linking:', error);
      return {
        success: false,
        error: 'Failed to link accounts'
      };
    }
  }

  /**
   * Validate linking token without processing
   */
  async validateLinkingToken(token: string): Promise<boolean> {
    try {
      const linkingToken = await this.prisma.accountLinkingToken.findUnique({
        where: { token }
      });

      if (!linkingToken) {
        return false;
      }

      // Check if token is expired or used
      return linkingToken.expiresAt > new Date() && !linkingToken.used;
    } catch (error) {
      console.error('Error validating linking token:', error);
      return false;
    }
  }

  /**
   * Get linking token details
   */
  async getLinkingTokenDetails(token: string) {
    try {
      const linkingToken = await this.prisma.accountLinkingToken.findUnique({
        where: { token },
        include: {
          existingUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              rNumber: true
            }
          }
        }
      });

      return linkingToken;
    } catch (error) {
      console.error('Error getting linking token details:', error);
      throw new Error('Failed to get linking token details');
    }
  }

  /**
   * Clean up expired linking tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await this.prisma.accountLinkingToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      // Don't throw error for cleanup operations
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
}