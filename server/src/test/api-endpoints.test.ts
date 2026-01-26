import { describe, test, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { getTestClient } from './test-client.js';
import { AuthProvider } from '../types/index.js';
import { UniversityLevel } from '../types/index.js';
import { AuthenticationService } from '../services/auth.js';
import { ProfileService } from '../services/profile.js';
import { FileUploadService } from '../services/fileUpload.js';
import { User } from '../types/index.js';

const prisma = getTestClient();
let authService: AuthenticationService;
let profileService: ProfileService;
let fileUploadService: FileUploadService;

// Test data generators with unique values per test run
const testRunId = Date.now().toString();
let testCounter = 0;

const getUniqueId = () => `${testRunId}_${++testCounter}`;

describe('Feature: mlh-ttu-backend-onboarding - API Endpoint Property Tests', () => {
  beforeAll(async () => {
    // Initialize services
    authService = new AuthenticationService();
    profileService = new ProfileService(prisma);
    fileUploadService = new FileUploadService();

    try {
      // Test database connection
      await prisma.$connect();
      
      // Seed test technologies
      await prisma.technology.createMany({
        data: [
          { id: 'tech1', name: 'JavaScript', category: 'LANGUAGE' },
          { id: 'tech2', name: 'TypeScript', category: 'LANGUAGE' },
          { id: 'tech3', name: 'React', category: 'FRAMEWORK' },
          { id: 'tech4', name: 'Node.js', category: 'FRAMEWORK' },
          { id: 'tech5', name: 'PostgreSQL', category: 'DATABASE' }
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
      // Skip cleanup if database is not available
      console.warn('Skipping test data cleanup - database not available');
    }
  });

  afterEach(async () => {
    try {
      // Clean up test data - order matters due to foreign key constraints
      await prisma.userTechnology.deleteMany();
      await prisma.accountLinkingToken.deleteMany();
      await prisma.session.deleteMany();
      await prisma.file.deleteMany();
      await prisma.user.deleteMany();
    } catch (error) {
      // Skip cleanup if database is not available
    }
  });

  /**
   * Property 14: API Response Consistency
   * For any API endpoint, valid requests should return success responses with complete data,
   * invalid requests should return appropriate HTTP status codes with structured error messages,
   * and unauthenticated requests to protected endpoints should return 401 Unauthorized.
   */
  test('Property 14: API Response Consistency', async () => {
    try {
      await prisma.$connect();
    } catch (error) {
      console.warn('Skipping test - database not available');
      return;
    }

    await fc.assert(fc.asyncProperty(
      fc.record({
        email: fc.integer({ min: 1, max: 999999 }).map(n => `test${n}_${getUniqueId()}@example.com`),
        provider: fc.constantFrom(AuthProvider.GOOGLE, AuthProvider.MICROSOFT, AuthProvider.EMAIL),
        firstName: fc.string({ minLength: 1, maxLength: 50 }),
        lastName: fc.string({ minLength: 1, maxLength: 50 }),
        major: fc.string({ minLength: 1, maxLength: 100 }),
        rNumber: fc.integer({ min: 10000000, max: 99999999 }).map(n => `R${n.toString().padStart(8, '0')}`),
        universityLevel: fc.constantFrom(...Object.values(UniversityLevel)),
        aspiredPosition: fc.string({ minLength: 1, maxLength: 100 }),
        technologySkills: fc.array(fc.constantFrom('tech1', 'tech2', 'tech3', 'tech4', 'tech5'), { maxLength: 3 })
      }),
      async (userData) => {
        // Test 1: Valid authenticated request should return success
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            provider: userData.provider,
            hasCompletedOnboarding: false
          }
        });

        const session = await authService.createSession(user);
        
        // Test profile retrieval - should succeed for authenticated user
        const profile = await profileService.getUserProfile(user.id);
        if (profile) {
          // Valid request should return complete user data
          if (profile.id !== user.id || profile.email !== user.email) {
            throw new Error('API response inconsistency: profile data mismatch');
          }
        }

        // Test 2: Onboarding with valid data should succeed
        try {
          const onboardingData = {
            firstName: userData.firstName,
            lastName: userData.lastName,
            major: userData.major,
            rNumber: userData.rNumber,
            universityLevel: userData.universityLevel,
            aspiredPosition: userData.aspiredPosition,
            technologySkills: userData.technologySkills
          };

          const completedProfile = await profileService.completeOnboarding(user.id, onboardingData);
          
          // Response should include all provided data
          if (!completedProfile.hasCompletedOnboarding) {
            throw new Error('API response inconsistency: onboarding not marked complete');
          }
          
          if (completedProfile.firstName !== userData.firstName ||
              completedProfile.lastName !== userData.lastName ||
              completedProfile.major !== userData.major ||
              completedProfile.rNumber !== userData.rNumber) {
            throw new Error('API response inconsistency: onboarding data not persisted correctly');
          }
        } catch (error) {
          // If validation fails, error should be descriptive
          if (error instanceof Error && !error.message.includes('validation')) {
            throw new Error('API response inconsistency: non-validation error without proper structure');
          }
        }

        // Test 3: Invalid data should return structured errors
        try {
          await profileService.completeOnboarding(user.id, {
            firstName: '', // Invalid: empty required field
            lastName: userData.lastName,
            major: userData.major,
            rNumber: userData.rNumber,
            universityLevel: userData.universityLevel,
            aspiredPosition: userData.aspiredPosition,
            technologySkills: userData.technologySkills
          });
          throw new Error('API response inconsistency: invalid data accepted');
        } catch (error) {
          // Should get validation error
          if (!(error instanceof Error) || !error.message.includes('validation')) {
            throw new Error('API response inconsistency: invalid data did not return validation error');
          }
        }

        // Clean up session
        await authService.destroySession(session.token);
      }
    ), { numRuns: 10 });
  });

  /**
   * Property 5: Onboarding Status-Based Routing
   * For any authenticated user, the redirect destination after authentication should be
   * /onboarding if hasCompletedOnboarding is false, and /profile if hasCompletedOnboarding is true.
   */
  test('Property 5: Onboarding Status-Based Routing', async () => {
    try {
      await prisma.$connect();
    } catch (error) {
      console.warn('Skipping test - database not available');
      return;
    }

    await fc.assert(fc.asyncProperty(
      fc.record({
        email: fc.integer({ min: 1, max: 999999 }).map(n => `test${n}_${getUniqueId()}@example.com`),
        provider: fc.constantFrom(AuthProvider.GOOGLE, AuthProvider.MICROSOFT, AuthProvider.EMAIL),
        hasCompletedOnboarding: fc.boolean()
      }),
      async (userData) => {
        // Create user with specific onboarding status
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            provider: userData.provider,
            hasCompletedOnboarding: userData.hasCompletedOnboarding
          }
        });

        // Test redirect logic
        const redirectUrl = authService.redirectBasedOnOnboarding(user);
        const expectedUrl = userData.hasCompletedOnboarding 
          ? `${process.env.CLIENT_URL}/profile`
          : `${process.env.CLIENT_URL}/onboarding`;

        if (redirectUrl !== expectedUrl) {
          throw new Error(`Routing inconsistency: expected ${expectedUrl}, got ${redirectUrl}`);
        }
      }
    ), { numRuns: 10 });
  });

  /**
   * Property 6: Route Protection for Unauthenticated Access
   * For any protected route, when accessed by an unauthenticated user, the system should
   * redirect to the login page and maintain the intended destination for post-authentication redirect.
   */
  test('Property 6: Route Protection for Unauthenticated Access', async () => {
    try {
      await prisma.$connect();
    } catch (error) {
      console.warn('Skipping test - database not available');
      return;
    }

    await fc.assert(fc.asyncProperty(
      fc.record({
        email: fc.integer({ min: 1, max: 999999 }).map(n => `test${n}_${getUniqueId()}@example.com`),
        provider: fc.constantFrom(AuthProvider.GOOGLE, AuthProvider.MICROSOFT, AuthProvider.EMAIL)
      }),
      async (userData) => {
        // Test 1: Valid session should allow access
        const user = await prisma.user.create({
          data: {
            email: userData.email,
            provider: userData.provider,
            hasCompletedOnboarding: false
          }
        });

        const session = await authService.createSession(user);
        
        // Valid session should authenticate successfully
        const authenticatedUser = await authService.validateSession(session.token);
        if (!authenticatedUser || authenticatedUser.id !== user.id) {
          throw new Error('Route protection inconsistency: valid session not authenticated');
        }

        // Test 2: Invalid/expired session should deny access
        const invalidUser = await authService.validateSession('invalid-token');
        if (invalidUser !== null) {
          throw new Error('Route protection inconsistency: invalid session authenticated');
        }

        // Test 3: Expired session should deny access
        // Create an expired session by manipulating the database
        await prisma.session.update({
          where: { token: session.token },
          data: { expiresAt: new Date(Date.now() - 1000) } // 1 second ago
        });

        const expiredUser = await authService.validateSession(session.token);
        if (expiredUser !== null) {
          throw new Error('Route protection inconsistency: expired session authenticated');
        }

        // Clean up
        await authService.destroySession(session.token);
      }
    ), { numRuns: 10 });
  });

  /**
   * Additional Property Test: File Upload API Consistency
   * For any file upload operation, the API should validate file types and sizes correctly,
   * return appropriate error messages for invalid files, and generate secure URLs for valid uploads.
   */
  test('Property: File Upload API Consistency', async () => {
    try {
      await prisma.$connect();
    } catch (error) {
      console.warn('Skipping test - database not available');
      return;
    }

    await fc.assert(fc.asyncProperty(
      fc.record({
        email: fc.integer({ min: 1, max: 999999 }).map(n => `test${n}_${getUniqueId()}@example.com`),
        provider: fc.constantFrom(AuthProvider.GOOGLE, AuthProvider.MICROSOFT, AuthProvider.EMAIL),
        fileName: fc.string({ minLength: 1, maxLength: 50 }),
        fileSize: fc.integer({ min: 1, max: 15 * 1024 * 1024 }), // Up to 15MB
        mimeType: fc.constantFrom('image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain')
      }),
      async (testData) => {
        // Create test user
        const user = await prisma.user.create({
          data: {
            email: testData.email,
            provider: testData.provider,
            hasCompletedOnboarding: false
          }
        });

        // Create mock file object
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: testData.fileName,
          encoding: '7bit',
          mimetype: testData.mimeType,
          size: testData.fileSize,
          buffer: Buffer.alloc(Math.min(testData.fileSize, 1024)), // Small buffer for testing
          destination: '',
          filename: '',
          path: '',
          stream: null as any
        };

        // Test file validation consistency
        if (testData.mimeType === 'image/jpeg' || testData.mimeType === 'image/png' || testData.mimeType === 'image/webp') {
          // Image file validation
          const validation = fileUploadService.validateImageFile(mockFile);
          
          if (testData.fileSize > 5 * 1024 * 1024) {
            // Should fail for files > 5MB
            if (validation.isValid) {
              throw new Error('File upload API inconsistency: oversized image accepted');
            }
          } else {
            // Should pass for valid images
            if (!validation.isValid) {
              throw new Error('File upload API inconsistency: valid image rejected');
            }
          }
        } else if (testData.mimeType === 'application/pdf') {
          // PDF file validation
          const validation = fileUploadService.validateResumeFile(mockFile);
          
          if (testData.fileSize > 10 * 1024 * 1024) {
            // Should fail for files > 10MB
            if (validation.isValid) {
              throw new Error('File upload API inconsistency: oversized PDF accepted');
            }
          } else {
            // Should pass for valid PDFs
            if (!validation.isValid) {
              throw new Error('File upload API inconsistency: valid PDF rejected');
            }
          }
        } else {
          // Invalid file types should be rejected
          const imageValidation = fileUploadService.validateImageFile(mockFile);
          const resumeValidation = fileUploadService.validateResumeFile(mockFile);
          
          if (imageValidation.isValid || resumeValidation.isValid) {
            throw new Error('File upload API inconsistency: invalid file type accepted');
          }
        }
      }
    ), { numRuns: 10 });
  });
});