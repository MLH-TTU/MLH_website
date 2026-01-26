import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { getTestClient } from './test-client.js';
import { ProfileService } from '../services/profile.js';
import { DuplicateDetectionService } from '../services/duplicateDetection.js';
import { OnboardingData, UniversityLevel, AuthProvider } from '../types/index.js';

const prisma = getTestClient();
const profileService = new ProfileService(prisma);
const duplicateDetectionService = new DuplicateDetectionService(prisma);

// Test data generators with unique values per test run
const testRunId = Date.now().toString();
let testCounter = 0;

const getUniqueId = () => `${testRunId}_${++testCounter}`;

const validFirstName = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const validLastName = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const validMajor = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const validRNumber = fc.integer({ min: 10000000, max: 99999999 }).map(n => `R${n.toString().padStart(8, '0')}`);
const validUniversityLevel = fc.constantFrom(...Object.values(UniversityLevel));
const validAspiredPosition = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);
const validEmail = fc.integer({ min: 1, max: 999999 }).map(n => `test${n}_${getUniqueId()}@example.com`);
const validAuthProvider = fc.constantFrom(...Object.values(AuthProvider));

const validGithubUrl = fc.string({ minLength: 1, maxLength: 39 })
  .filter(s => /^[a-zA-Z0-9]([a-zA-Z0-9-])*$/.test(s))
  .map(username => `https://github.com/${username}`);

const validLinkedinUrl = fc.string({ minLength: 1, maxLength: 50 })
  .filter(s => /^[a-zA-Z0-9-]+$/.test(s))
  .map(username => `https://linkedin.com/in/${username}`);

const validTwitterUrl = fc.string({ minLength: 1, maxLength: 15 })
  .filter(s => /^[a-zA-Z0-9_]+$/.test(s))
  .map(username => `https://twitter.com/${username}`);

const validOnboardingData = fc.record({
  firstName: validFirstName,
  lastName: validLastName,
  major: validMajor,
  rNumber: validRNumber,
  universityLevel: validUniversityLevel,
  aspiredPosition: validAspiredPosition,
  githubUrl: fc.option(validGithubUrl, { nil: undefined }),
  linkedinUrl: fc.option(validLinkedinUrl, { nil: undefined }),
  twitterUrl: fc.option(validTwitterUrl, { nil: undefined }),
  technologySkills: fc.array(fc.string(), { maxLength: 10 })
});

describe('Feature: mlh-ttu-backend-onboarding, Profile Operations Property Tests', () => {
  beforeEach(async () => {
    // Clean up test data before each test - order matters due to foreign key constraints
    try {
      await prisma.userTechnology.deleteMany();
      await prisma.accountLinkingToken.deleteMany();
      await prisma.session.deleteMany();
      await prisma.file.deleteMany();
      await prisma.user.deleteMany();
      await prisma.technology.deleteMany();
      
      // Create some test technologies
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
      console.warn('Database cleanup failed:', error);
    }
  });

  afterEach(async () => {
    // Clean up test data after each test - order matters due to foreign key constraints
    try {
      await prisma.userTechnology.deleteMany();
      await prisma.accountLinkingToken.deleteMany();
      await prisma.session.deleteMany();
      await prisma.file.deleteMany();
      await prisma.user.deleteMany();
      await prisma.technology.deleteMany();
    } catch (error) {
      console.warn('Database cleanup failed:', error);
    }
  });

  test('Feature: mlh-ttu-backend-onboarding, Property 13: Complete Profile Data Persistence', async () => {
    await fc.assert(fc.asyncProperty(
      validEmail,
      validAuthProvider,
      validOnboardingData.map(data => ({
        ...data,
        technologySkills: ['tech1', 'tech2', 'tech3'] // Use valid tech IDs
      })),
      async (email, provider, onboardingData) => {
        // Create a user first
        const user = await prisma.user.create({
          data: {
            email,
            provider,
            hasCompletedOnboarding: false
          }
        });

        // Complete onboarding
        const completedUser = await profileService.completeOnboarding(user.id, onboardingData);

        // Verify all data is persisted correctly
        expect(completedUser.hasCompletedOnboarding).toBe(true);
        expect(completedUser.firstName).toBe(onboardingData.firstName);
        expect(completedUser.lastName).toBe(onboardingData.lastName);
        expect(completedUser.major).toBe(onboardingData.major);
        expect(completedUser.rNumber).toBe(onboardingData.rNumber);
        expect(completedUser.universityLevel).toBe(onboardingData.universityLevel);
        expect(completedUser.aspiredPosition).toBe(onboardingData.aspiredPosition);
        expect(completedUser.githubUrl).toBe(onboardingData.githubUrl);
        expect(completedUser.linkedinUrl).toBe(onboardingData.linkedinUrl);
        expect(completedUser.twitterUrl).toBe(onboardingData.twitterUrl);

        // Verify technology skills are persisted
        const userTechs = await prisma.userTechnology.findMany({
          where: { userId: user.id }
        });
        expect(userTechs).toHaveLength(onboardingData.technologySkills.length);

        // Verify data can be retrieved
        const retrievedUser = await profileService.getUserProfile(user.id);
        expect(retrievedUser).not.toBeNull();
        expect(retrievedUser!.hasCompletedOnboarding).toBe(true);
        expect(retrievedUser!.firstName).toBe(onboardingData.firstName);
      }
    ), { numRuns: 10 });
  });

  test('Feature: mlh-ttu-backend-onboarding, Property 12: Account Linking Flow Integrity', async () => {
    await fc.assert(fc.asyncProperty(
      validRNumber,
      validEmail,
      validEmail,
      validAuthProvider,
      validAuthProvider,
      validOnboardingData.map(data => ({
        ...data,
        technologySkills: ['tech1', 'tech2']
      })),
      async (rNumber, existingEmail, newEmail, existingProvider, newProvider, onboardingData) => {
        // Skip if emails are the same
        if (existingEmail === newEmail) return;

        // Create existing user with completed onboarding
        const existingUser = await prisma.user.create({
          data: {
            email: existingEmail,
            provider: existingProvider,
            hasCompletedOnboarding: true,
            firstName: onboardingData.firstName,
            lastName: onboardingData.lastName,
            major: onboardingData.major,
            rNumber: rNumber,
            universityLevel: onboardingData.universityLevel,
            aspiredPosition: onboardingData.aspiredPosition
          }
        });

        // Create account linking token
        const token = await duplicateDetectionService.createAccountLinkingToken(
          existingUser.id,
          newEmail,
          newProvider
        );

        // Process account linking
        const linkResult = await duplicateDetectionService.processAccountLinking(token);

        // Verify linking was successful
        expect(linkResult.success).toBe(true);
        expect(linkResult.user).toBeDefined();

        if (linkResult.user) {
          // Verify the account was linked correctly
          expect(linkResult.user.id).toBe(existingUser.id);
          expect(linkResult.user.email).toBe(newEmail);
          expect(linkResult.user.provider).toBe(newProvider);
          expect(linkResult.user.rNumber).toBe(rNumber);
          
          // Verify original data is preserved
          expect(linkResult.user.firstName).toBe(onboardingData.firstName);
          expect(linkResult.user.lastName).toBe(onboardingData.lastName);
          expect(linkResult.user.hasCompletedOnboarding).toBe(true);
        }

        // Verify token is marked as used
        const tokenDetails = await duplicateDetectionService.getLinkingTokenDetails(token);
        expect(tokenDetails?.used).toBe(true);

        // Verify token cannot be used again
        const secondLinkResult = await duplicateDetectionService.processAccountLinking(token);
        expect(secondLinkResult.success).toBe(false);
        expect(secondLinkResult.error).toContain('already been used');
      }
    ), { numRuns: 10 });
  });

  test('R Number Uniqueness Enforcement', async () => {
    await fc.assert(fc.asyncProperty(
      validRNumber,
      validEmail,
      validEmail,
      validAuthProvider,
      validAuthProvider,
      async (rNumber, email1, email2, provider1, provider2) => {
        // Skip if emails are the same
        if (email1 === email2) return;

        // Create first user with R Number
        const user1 = await prisma.user.create({
          data: {
            email: email1,
            provider: provider1,
            rNumber: rNumber,
            hasCompletedOnboarding: true
          }
        });

        // Try to create second user with same R Number
        await expect(prisma.user.create({
          data: {
            email: email2,
            provider: provider2,
            rNumber: rNumber,
            hasCompletedOnboarding: false
          }
        })).rejects.toThrow();

        // Verify duplicate detection works
        const duplicateUser = await duplicateDetectionService.checkRNumberExists(rNumber);
        expect(duplicateUser).not.toBeNull();
        expect(duplicateUser!.id).toBe(user1.id);
      }
    ), { numRuns: 10 });
  });

  test('Profile Update Data Integrity', async () => {
    await fc.assert(fc.asyncProperty(
      validEmail,
      validAuthProvider,
      validOnboardingData.map(data => ({
        ...data,
        technologySkills: ['tech1', 'tech2']
      })),
      fc.record({
        firstName: fc.option(validFirstName, { nil: undefined }),
        lastName: fc.option(validLastName, { nil: undefined }),
        major: fc.option(validMajor, { nil: undefined }),
        aspiredPosition: fc.option(validAspiredPosition, { nil: undefined })
      }),
      async (email, provider, initialData, updateData) => {
        // Create and complete onboarding for a user
        const user = await prisma.user.create({
          data: {
            email,
            provider,
            hasCompletedOnboarding: false
          }
        });

        await profileService.completeOnboarding(user.id, initialData);

        // Update profile with partial data
        const updatedUser = await profileService.updateUserProfile(user.id, updateData);

        // Verify updates were applied correctly
        if (updateData.firstName !== undefined) {
          expect(updatedUser.firstName).toBe(updateData.firstName);
        } else {
          expect(updatedUser.firstName).toBe(initialData.firstName);
        }

        if (updateData.lastName !== undefined) {
          expect(updatedUser.lastName).toBe(updateData.lastName);
        } else {
          expect(updatedUser.lastName).toBe(initialData.lastName);
        }

        // Verify unchanged fields remain the same
        expect(updatedUser.hasCompletedOnboarding).toBe(true);
        expect(updatedUser.rNumber).toBe(initialData.rNumber);
      }
    ), { numRuns: 10 });
  });
});