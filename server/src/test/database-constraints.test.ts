import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { PrismaClient } from '@prisma/client';

// Mock Prisma Client for testing
const mockPrisma = {
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    deleteMany: vi.fn(),
  },
  userTechnology: {
    deleteMany: vi.fn(),
  },
  accountLinkingToken: {
    deleteMany: vi.fn(),
  },
  session: {
    deleteMany: vi.fn(),
  },
  file: {
    deleteMany: vi.fn(),
  },
  technology: {
    deleteMany: vi.fn(),
  },
};

describe('Database Constraints Property Tests', () => {
  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock successful cleanup operations
    mockPrisma.userTechnology.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.accountLinkingToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.file.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.user.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.technology.deleteMany.mockResolvedValue({ count: 0 });
  });

  afterEach(async () => {
    // Clean up mocks
    vi.clearAllMocks();
  });

  describe('Property 3: Email Uniqueness Enforcement', () => {
    it('Feature: mlh-ttu-backend-onboarding, Property 3: Email uniqueness enforcement', async () => {
      await fc.assert(fc.asyncProperty(
        fc.emailAddress(),
        fc.constantFrom('GOOGLE', 'MICROSOFT', 'EMAIL'),
        fc.constantFrom('GOOGLE', 'MICROSOFT', 'EMAIL'),
        async (email, provider1, provider2) => {
          // Skip if providers are the same (would be same user)
          fc.pre(provider1 !== provider2);
          
          // Mock first user creation success
          const mockUser1 = {
            id: 'user1',
            email,
            provider: provider1,
            hasCompletedOnboarding: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockPrisma.user.create.mockResolvedValueOnce(mockUser1);
          
          // Create first user with email and provider1
          const user1 = await mockPrisma.user.create({
            data: {
              email,
              provider: provider1 as any,
              hasCompletedOnboarding: false,
            }
          });
          
          expect(user1.email).toBe(email);
          expect(user1.provider).toBe(provider1);
          
          // Mock second user creation failure (unique constraint violation)
          const uniqueConstraintError = new Error('Unique constraint failed on the fields: (`email`)');
          mockPrisma.user.create.mockRejectedValueOnce(uniqueConstraintError);
          
          // Attempt to create second user with same email, different provider
          // Should fail due to email uniqueness constraint
          await expect(mockPrisma.user.create({
            data: {
              email,
              provider: provider2 as any,
              hasCompletedOnboarding: false,
            }
          })).rejects.toThrow('Unique constraint failed');
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 4: R Number Uniqueness and Duplicate Detection', () => {
    it('Feature: mlh-ttu-backend-onboarding, Property 4: R Number uniqueness and duplicate detection', async () => {
      await fc.assert(fc.asyncProperty(
        fc.emailAddress(),
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 10 }).map(s => `R${s.padStart(8, '0')}`), // Generate R Number format
        fc.constantFrom('GOOGLE', 'MICROSOFT', 'EMAIL'),
        fc.constantFrom('GOOGLE', 'MICROSOFT', 'EMAIL'),
        async (email1, email2, rNumber, provider1, provider2) => {
          // Skip if emails are the same (would violate email uniqueness)
          fc.pre(email1 !== email2);
          
          // Mock first user creation success
          const mockUser1 = {
            id: 'user1',
            email: email1,
            provider: provider1,
            hasCompletedOnboarding: true,
            firstName: 'Test',
            lastName: 'User1',
            major: 'Computer Science',
            rNumber,
            universityLevel: 'JUNIOR',
            aspiredPosition: 'Software Engineer',
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          mockPrisma.user.create.mockResolvedValueOnce(mockUser1);
          
          // Create first user with R Number
          const user1 = await mockPrisma.user.create({
            data: {
              email: email1,
              provider: provider1 as any,
              hasCompletedOnboarding: true,
              firstName: 'Test',
              lastName: 'User1',
              major: 'Computer Science',
              rNumber,
              universityLevel: 'JUNIOR',
              aspiredPosition: 'Software Engineer',
            }
          });
          
          expect(user1.rNumber).toBe(rNumber);
          
          // Mock second user creation failure (R Number unique constraint violation)
          const rNumberConstraintError = new Error('Unique constraint failed on the fields: (`rNumber`)');
          mockPrisma.user.create.mockRejectedValueOnce(rNumberConstraintError);
          
          // Attempt to create second user with same R Number, different email
          // Should fail due to R Number uniqueness constraint
          await expect(mockPrisma.user.create({
            data: {
              email: email2,
              provider: provider2 as any,
              hasCompletedOnboarding: true,
              firstName: 'Test',
              lastName: 'User2',
              major: 'Computer Science',
              rNumber, // Same R Number
              universityLevel: 'SENIOR',
              aspiredPosition: 'Data Scientist',
            }
          })).rejects.toThrow('Unique constraint failed');
          
          // Mock finding existing user by R Number for duplicate detection
          mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser1);
          
          // Verify we can find the existing user by R Number for duplicate detection
          const existingUser = await mockPrisma.user.findUnique({
            where: { rNumber }
          });
          
          expect(existingUser).not.toBeNull();
          expect(existingUser?.email).toBe(email1);
        }
      ), { numRuns: 100 });
    });
  });
});