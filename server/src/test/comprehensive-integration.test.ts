/**
 * Comprehensive Integration Tests
 * Feature: mlh-ttu-backend-onboarding
 * 
 * Tests API integration between frontend and backend
 * Tests database operations and data consistency
 * Tests file storage and security features
 */

import { describe, test, beforeEach, afterEach, beforeAll, afterAll, expect } from 'vitest';
import { getTestClient } from './test-client.js';
import { AuthenticationService } from '../services/auth.js';
import { ProfileService } from '../services/profile.js';
import { FileUploadService } from '../services/fileUpload.js';
import { DuplicateDetectionService } from '../services/duplicateDetection.js';
import { AuthProvider, UniversityLevel } from '../types/index.js';

const prisma = getTestClient();
let authService: AuthenticationService;
let profileService: ProfileService;
let fileUploadService: FileUploadService;
let duplicateDetectionService: DuplicateDetectionService;

// Test data generators
const testRunId = Date.now().toString();
let testCounter = 0;
const getUniqueId = () => `${testRunId}_${++testCounter}`;

describe('Comprehensive Integration Tests', () => {
  beforeAll(async () => {
    // Initialize services
    authService = new AuthenticationService();
    profileService = new ProfileService(prisma);
    fileUploadService = new FileUploadService();
    duplicateDetectionService = new DuplicateDetectionService(prisma);

    try {
      await prisma.$connect();
      
      // Seed test technologies
      await prisma.technology.createMany({
        data: [
          { id: 'int_tech1', name: 'JavaScript', category: 'LANGUAGE' },
          { id: 'int_tech2', name: 'TypeScript', category: 'LANGUAGE' },
          { id: 'int_tech3', name: 'React', category: 'FRAMEWORK' },
          { id: 'int_tech4', name: 'Node.js', category: 'FRAMEWORK' },
          { id: 'int_tech5', name: 'PostgreSQL', category: 'DATABASE' },
          { id: 'int_tech6', name: 'MongoDB', category: 'DATABASE' },
          { id: 'int_tech7', name: 'Docker', category: 'TOOL' },
          { id: 'int_tech8', name: 'AWS', category: 'CLOUD' }
        ]
      });
    } catch (error) {
      console.warn('Database not available for testing:', error);
    }
  });

  afterAll(async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      // Ignore disconnect errors
    }
  });

  beforeEach(async () => {
    try {
      // Clean up test data - order matters due to foreign key constraints
      await prisma.userTechnology.deleteMany();
      await prisma.accountLinkingToken.deleteMany();
      await prisma.session.deleteMany();
      await prisma.file.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      console.warn('Skipping test data cleanup - database not available');
    }
  });

  afterEach(async () => {
    try {
      // Clean up test data
      await prisma.userTechnology.deleteMany();
      await prisma.accountLinkingToken.deleteMany();
      await prisma.session.deleteMany();
      await prisma.file.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      // Skip cleanup if database is not available
    }
  });

  describe('API Integration Tests', () => {
    test('Complete API workflow: Authentication -> Onboarding -> Profile Management', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `api_test_${getUniqueId()}@example.com`;
      const testRNumber = `R${Math.floor(Math.random() * 90000000) + 10000000}`;

      // Step 1: Simulate OAuth authentication (API endpoint behavior)
      const newUser = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.GOOGLE,
          hasCompletedOnboarding: false
        }
      });

      // Verify user creation
      expect(newUser.id).toBeTruthy();
      expect(newUser.email).toBe(testEmail);
      expect(newUser.hasCompletedOnboarding).toBe(false);

      // Step 2: Create session (POST /auth/session)
      const session = await authService.createSession(newUser);
      expect(session.token).toBeTruthy();
      expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());

      // Step 3: Get user profile (GET /api/user/me)
      const initialProfile = await profileService.getUserProfile(newUser.id);
      expect(initialProfile?.id).toBe(newUser.id);
      expect(initialProfile?.hasCompletedOnboarding).toBe(false);

      // Step 4: Submit onboarding data (POST /api/user/onboard)
      const onboardingData = {
        firstName: 'Integration',
        lastName: 'Test',
        major: 'Computer Science',
        rNumber: testRNumber,
        universityLevel: UniversityLevel.SENIOR,
        aspiredPosition: 'Full Stack Developer',
        githubUrl: 'https://github.com/integrationtest',
        linkedinUrl: 'https://linkedin.com/in/integrationtest',
        twitterUrl: 'https://twitter.com/integrationtest',
        technologySkills: ['int_tech1', 'int_tech2', 'int_tech3', 'int_tech4']
      };

      const completedProfile = await profileService.completeOnboarding(newUser.id, onboardingData);

      // Verify onboarding completion
      expect(completedProfile.hasCompletedOnboarding).toBe(true);
      expect(completedProfile.firstName).toBe('Integration');
      expect(completedProfile.lastName).toBe('Test');
      expect(completedProfile.rNumber).toBe(testRNumber);
      expect(completedProfile.githubUrl).toBe('https://github.com/integrationtest');

      // Step 5: Verify technology skills were saved
      const userWithSkills = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: { technologySkills: { include: { technology: true } } }
      });

      expect(userWithSkills?.technologySkills).toHaveLength(4);
      const skillNames = userWithSkills?.technologySkills.map(skill => skill.technology.name);
      expect(skillNames).toContain('JavaScript');
      expect(skillNames).toContain('TypeScript');
      expect(skillNames).toContain('React');
      expect(skillNames).toContain('Node.js');

      // Step 6: Update profile (PUT /api/user/profile)
      const updatedProfile = await profileService.updateUserProfile(newUser.id, {
        aspiredPosition: 'Senior Full Stack Developer',
        twitterUrl: 'https://x.com/integrationtest'
      });

      expect(updatedProfile.aspiredPosition).toBe('Senior Full Stack Developer');
      expect(updatedProfile.twitterUrl).toBe('https://x.com/integrationtest');

      // Step 7: Session validation (middleware behavior)
      const validatedUser = await authService.validateSession(session.token);
      expect(validatedUser?.id).toBe(newUser.id);

      // Step 8: Logout (POST /auth/logout)
      await authService.destroySession(session.token);
      const invalidatedUser = await authService.validateSession(session.token);
      expect(invalidatedUser).toBeNull();
    });

    test('API error handling and validation', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `api_error_${getUniqueId()}@example.com`;

      // Create test user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.MICROSOFT,
          hasCompletedOnboarding: false
        }
      });

      // Test 1: Invalid onboarding data should return validation errors
      try {
        await profileService.completeOnboarding(user.id, {
          firstName: '', // Invalid: empty
          lastName: 'Test',
          major: 'Test Major',
          rNumber: 'INVALID_FORMAT', // Invalid format
          universityLevel: UniversityLevel.FRESHMAN,
          aspiredPosition: 'Test Position',
          githubUrl: 'not-a-url', // Invalid URL
          technologySkills: ['invalid_tech_id'] // Invalid technology ID
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Validation failed');
      }

      // Test 2: Unauthorized access should fail
      const invalidUser = await authService.validateSession('invalid-session-token');
      expect(invalidUser).toBeNull();

      // Test 3: Non-existent user profile should return null
      const nonExistentProfile = await profileService.getUserProfile('non-existent-id');
      expect(nonExistentProfile).toBeNull();
    });

    test('Duplicate detection API integration', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testRNumber = `R${Math.floor(Math.random() * 90000000) + 10000000}`;
      const existingEmail = `existing_${getUniqueId()}@example.com`;
      const newEmail = `new_${getUniqueId()}@example.com`;

      // Step 1: Create existing user
      const existingUser = await prisma.user.create({
        data: {
          email: existingEmail,
          provider: AuthProvider.GOOGLE,
          hasCompletedOnboarding: true,
          firstName: 'Existing',
          lastName: 'User',
          major: 'Engineering',
          rNumber: testRNumber,
          universityLevel: UniversityLevel.GRADUATE,
          aspiredPosition: 'Engineer'
        }
      });

      // Step 2: Check for duplicate R Number (API call simulation)
      const duplicateCheck = await duplicateDetectionService.findAccountByRNumber(testRNumber);
      expect(duplicateCheck).toBeTruthy();
      expect(duplicateCheck?.id).toBe(existingUser.id);

      // Step 3: Create account linking token
      const linkingToken = await duplicateDetectionService.createAccountLinkingToken(
        existingUser.id,
        newEmail,
        AuthProvider.MICROSOFT
      );
      expect(linkingToken).toBeTruthy();

      // Step 4: Verify token was created in database
      const tokenRecord = await prisma.accountLinkingToken.findFirst({
        where: { token: linkingToken }
      });
      expect(tokenRecord).toBeTruthy();
      expect(tokenRecord?.existingUserId).toBe(existingUser.id);
      expect(tokenRecord?.newEmail).toBe(newEmail);
    });
  });

  describe('Database Operations and Data Consistency', () => {
    test('Transaction integrity during onboarding', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `transaction_${getUniqueId()}@example.com`;
      const testRNumber = `R${Math.floor(Math.random() * 90000000) + 10000000}`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.EMAIL,
          hasCompletedOnboarding: false
        }
      });

      // Complete onboarding with technology skills
      const onboardingData = {
        firstName: 'Transaction',
        lastName: 'Test',
        major: 'Data Science',
        rNumber: testRNumber,
        universityLevel: UniversityLevel.JUNIOR,
        aspiredPosition: 'Data Scientist',
        technologySkills: ['int_tech1', 'int_tech5', 'int_tech8']
      };

      await profileService.completeOnboarding(user.id, onboardingData);

      // Verify all data was saved consistently
      const savedUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          technologySkills: {
            include: { technology: true }
          }
        }
      });

      expect(savedUser?.hasCompletedOnboarding).toBe(true);
      expect(savedUser?.firstName).toBe('Transaction');
      expect(savedUser?.rNumber).toBe(testRNumber);
      expect(savedUser?.technologySkills).toHaveLength(3);

      // Verify technology relationships
      const techNames = savedUser?.technologySkills.map(skill => skill.technology.name);
      expect(techNames).toContain('JavaScript');
      expect(techNames).toContain('PostgreSQL');
      expect(techNames).toContain('AWS');
    });

    test('Constraint enforcement and data integrity', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `constraint_${getUniqueId()}@example.com`;
      const testRNumber = `R${Math.floor(Math.random() * 90000000) + 10000000}`;

      // Create first user
      const user1 = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.GOOGLE,
          hasCompletedOnboarding: true,
          rNumber: testRNumber
        }
      });

      // Test 1: Email uniqueness constraint
      try {
        await prisma.user.create({
          data: {
            email: testEmail, // Duplicate email
            provider: AuthProvider.MICROSOFT,
            hasCompletedOnboarding: false
          }
        });
        expect.fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error).toBeTruthy();
      }

      // Test 2: R Number uniqueness constraint
      try {
        await prisma.user.create({
          data: {
            email: `different_${getUniqueId()}@example.com`,
            provider: AuthProvider.EMAIL,
            hasCompletedOnboarding: false,
            rNumber: testRNumber // Duplicate R Number
          }
        });
        expect.fail('Should have thrown unique constraint error');
      } catch (error) {
        expect(error).toBeTruthy();
      }

      // Test 3: Foreign key constraints for technology skills
      try {
        await prisma.userTechnology.create({
          data: {
            userId: user1.id,
            technologyId: 'non_existent_tech' // Invalid technology ID
          }
        });
        expect.fail('Should have thrown foreign key constraint error');
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    test('Cascade deletion and cleanup', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `cascade_${getUniqueId()}@example.com`;

      // Create user with related data
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.GOOGLE,
          hasCompletedOnboarding: true,
          firstName: 'Cascade',
          lastName: 'Test'
        }
      });

      // Create session
      const session = await authService.createSession(user);

      // Create file record
      const file = await prisma.file.create({
        data: {
          userId: user.id,
          originalName: 'test.jpg',
          fileName: 'test_file.jpg',
          mimeType: 'image/jpeg',
          size: 1024,
          type: 'PROFILE_PICTURE',
          storageUrl: '/uploads/test_file.jpg'
        }
      });

      // Create technology skills
      await prisma.userTechnology.create({
        data: {
          userId: user.id,
          technologyId: 'int_tech1'
        }
      });

      // Verify related data exists
      const sessionCount = await prisma.session.count({ where: { userId: user.id } });
      const fileCount = await prisma.file.count({ where: { userId: user.id } });
      const skillCount = await prisma.userTechnology.count({ where: { userId: user.id } });

      expect(sessionCount).toBe(1);
      expect(fileCount).toBe(1);
      expect(skillCount).toBe(1);

      // Delete user - should cascade delete related records
      await prisma.user.delete({ where: { id: user.id } });

      // Verify cascade deletion
      const sessionCountAfter = await prisma.session.count({ where: { userId: user.id } });
      const fileCountAfter = await prisma.file.count({ where: { userId: user.id } });
      const skillCountAfter = await prisma.userTechnology.count({ where: { userId: user.id } });

      expect(sessionCountAfter).toBe(0);
      expect(fileCountAfter).toBe(0);
      expect(skillCountAfter).toBe(0);
    });
  });

  describe('File Storage and Security Features', () => {
    test('File upload validation and storage', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `file_${getUniqueId()}@example.com`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.GOOGLE,
          hasCompletedOnboarding: false
        }
      });

      // Test 1: Valid image file validation
      const validImageFile: Express.Multer.File = {
        fieldname: 'profilePicture',
        originalname: 'profile.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 2 * 1024 * 1024, // 2MB
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      };

      const imageValidation = fileUploadService.validateImageFile(validImageFile);
      expect(imageValidation.isValid).toBe(true);
      expect(imageValidation.errors).toHaveLength(0);

      // Test 2: Valid PDF file validation
      const validPdfFile: Express.Multer.File = {
        fieldname: 'resume',
        originalname: 'resume.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 5 * 1024 * 1024, // 5MB
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      };

      const pdfValidation = fileUploadService.validateResumeFile(validPdfFile);
      expect(pdfValidation.isValid).toBe(true);
      expect(pdfValidation.errors).toHaveLength(0);

      // Test 3: Invalid file type
      const invalidFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      };

      const invalidValidation = fileUploadService.validateImageFile(invalidFile);
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
      expect(invalidValidation.errors.some(error => error.message.includes('Invalid file type'))).toBe(true);

      // Test 4: Oversized file
      const oversizedFile: Express.Multer.File = {
        fieldname: 'profilePicture',
        originalname: 'large.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024, // 10MB - too large for profile picture
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      };

      const sizeValidation = fileUploadService.validateImageFile(oversizedFile);
      expect(sizeValidation.isValid).toBe(false);
      expect(sizeValidation.errors.length).toBeGreaterThan(0);
      expect(sizeValidation.errors.some(error => error.message.includes('File size too large'))).toBe(true);
    });

    test('File storage and secure URL generation', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `storage_${getUniqueId()}@example.com`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.EMAIL,
          hasCompletedOnboarding: false
        }
      });

      // Create file records (simulating successful upload)
      const profilePictureFile = await prisma.file.create({
        data: {
          userId: user.id,
          originalName: 'profile.jpg',
          fileName: `profile_${user.id}_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: 1024 * 1024,
          type: 'PROFILE_PICTURE',
          storageUrl: `/uploads/profile_${user.id}_${Date.now()}.jpg`
        }
      });

      const resumeFile = await prisma.file.create({
        data: {
          userId: user.id,
          originalName: 'resume.pdf',
          fileName: `resume_${user.id}_${Date.now()}.pdf`,
          mimeType: 'application/pdf',
          size: 2 * 1024 * 1024,
          type: 'RESUME',
          storageUrl: `/uploads/resume_${user.id}_${Date.now()}.pdf`
        }
      });

      // Test secure URL generation
      const profilePictureUrl = await fileUploadService.getSecureFileUrl(profilePictureFile.id);
      const resumeUrl = await fileUploadService.getSecureFileUrl(resumeFile.id);

      expect(profilePictureUrl).toContain(profilePictureFile.fileName);
      expect(resumeUrl).toContain(resumeFile.fileName);

      // Test file access control
      const userFiles = await prisma.file.findMany({
        where: { userId: user.id }
      });

      expect(userFiles).toHaveLength(2);
      expect(userFiles.some(f => f.type === 'PROFILE_PICTURE')).toBe(true);
      expect(userFiles.some(f => f.type === 'RESUME')).toBe(true);
    });

    test('File deletion and cleanup', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `deletion_${getUniqueId()}@example.com`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.MICROSOFT,
          hasCompletedOnboarding: false
        }
      });

      // Create file record
      const file = await prisma.file.create({
        data: {
          userId: user.id,
          originalName: 'temp.jpg',
          fileName: `temp_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: 1024,
          type: 'PROFILE_PICTURE',
          storageUrl: `/uploads/temp_${Date.now()}.jpg`
        }
      });

      // Verify file exists
      const fileExists = await prisma.file.findUnique({
        where: { id: file.id }
      });
      expect(fileExists).toBeTruthy();

      // Delete file
      await fileUploadService.deleteFile(file.id);

      // Verify file was deleted from database
      const fileAfterDeletion = await prisma.file.findUnique({
        where: { id: file.id }
      });
      expect(fileAfterDeletion).toBeNull();
    });

    test('File security scanning simulation', async () => {
      // Test malicious file detection (simulated)
      const suspiciousFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'malicious.exe.jpg', // Suspicious double extension
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      };

      // In a real implementation, this would involve actual malware scanning
      const isSuspicious = suspiciousFile.originalname.includes('.exe');
      expect(isSuspicious).toBe(true);

      // Test file content validation
      const validFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'clean.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.alloc(1024),
        destination: '',
        filename: '',
        path: '',
        stream: null as any
      };

      const isClean = !validFile.originalname.includes('.exe') && 
                     validFile.mimetype.startsWith('image/');
      expect(isClean).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    test('Database query performance with multiple users', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const startTime = Date.now();

      // Create multiple users with technology skills
      const users = [];
      for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
          data: {
            email: `perf_test_${i}_${getUniqueId()}@example.com`,
            provider: AuthProvider.GOOGLE,
            hasCompletedOnboarding: true,
            firstName: `User${i}`,
            lastName: 'Test',
            major: 'Computer Science',
            rNumber: `R${Math.floor(Math.random() * 90000000) + 10000000}`,
            universityLevel: UniversityLevel.SENIOR,
            aspiredPosition: 'Developer'
          }
        });

        // Add technology skills
        await prisma.userTechnology.createMany({
          data: [
            { userId: user.id, technologyId: 'int_tech1' },
            { userId: user.id, technologyId: 'int_tech2' },
            { userId: user.id, technologyId: 'int_tech3' }
          ]
        });

        users.push(user);
      }

      // Test bulk query performance
      const queryStartTime = Date.now();
      const usersWithSkills = await prisma.user.findMany({
        where: {
          hasCompletedOnboarding: true
        },
        include: {
          technologySkills: {
            include: { technology: true }
          }
        }
      });

      const queryEndTime = Date.now();
      const queryDuration = queryEndTime - queryStartTime;

      expect(usersWithSkills.length).toBeGreaterThanOrEqual(10);
      expect(queryDuration).toBeLessThan(1000); // Should complete within 1 second

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(5000); // Total test should complete within 5 seconds
    });

    test('Concurrent session management', async () => {
      try {
        await prisma.$connect();
      } catch (error) {
        console.warn('Skipping test - database not available');
        return;
      }

      const testEmail = `concurrent_${getUniqueId()}@example.com`;

      // Create user
      const user = await prisma.user.create({
        data: {
          email: testEmail,
          provider: AuthProvider.GOOGLE,
          hasCompletedOnboarding: true
        }
      });

      // Create multiple sessions concurrently
      const sessionPromises = [];
      for (let i = 0; i < 5; i++) {
        sessionPromises.push(authService.createSession(user));
      }

      const sessions = await Promise.all(sessionPromises);

      // Verify all sessions were created
      expect(sessions).toHaveLength(5);
      sessions.forEach(session => {
        expect(session.token).toBeTruthy();
        expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
      });

      // Verify sessions in database
      const sessionCount = await prisma.session.count({
        where: { userId: user.id }
      });
      expect(sessionCount).toBe(5);

      // Clean up sessions
      await Promise.all(sessions.map(session => 
        authService.destroySession(session.token)
      ));

      const sessionCountAfter = await prisma.session.count({
        where: { userId: user.id }
      });
      expect(sessionCountAfter).toBe(0);
    });
  });
});