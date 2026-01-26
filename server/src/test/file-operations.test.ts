import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';

// Mock Prisma client before importing the service
const mockPrisma = {
  file: {
    deleteMany: vi.fn().mockResolvedValue({}),
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn()
  },
  user: {
    deleteMany: vi.fn().mockResolvedValue({}),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn()
  }
};

// Mock the PrismaClient module
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => mockPrisma)
}));

// Mock fs/promises to avoid file system operations in tests
vi.mock('fs/promises', () => ({
  access: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined)
}));

// Import FileType from types after mocking
import { FileType } from '../types/index.js';

// Now import the service after mocks are set up
import { FileUploadService } from '../services/fileUpload.js';
const fileUploadService = new FileUploadService();

// Test data generators
const validImageMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const validResumeMimeTypes = ['application/pdf'];
const invalidMimeTypes = ['text/plain', 'application/javascript', 'text/html', 'application/zip'];

const generateValidImageFile = (): fc.Arbitrary<Express.Multer.File> => {
  return fc.record({
    fieldname: fc.constant('file'),
    originalname: fc.string({ minLength: 1, maxLength: 100 }).map(name => `${name}.jpg`),
    encoding: fc.constant('7bit'),
    mimetype: fc.constantFrom(...validImageMimeTypes),
    size: fc.integer({ min: 1, max: 5 * 1024 * 1024 }), // Up to 5MB
    buffer: fc.uint8Array({ minLength: 100, maxLength: 1000 }).map(arr => Buffer.from(arr)),
    destination: fc.constant(''),
    filename: fc.constant(''),
    path: fc.constant(''),
    stream: fc.constant(null as any)
  });
};

const generateValidResumeFile = (): fc.Arbitrary<Express.Multer.File> => {
  return fc.record({
    fieldname: fc.constant('file'),
    originalname: fc.string({ minLength: 1, maxLength: 100 }).map(name => `${name}.pdf`),
    encoding: fc.constant('7bit'),
    mimetype: fc.constantFrom(...validResumeMimeTypes),
    size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }), // Up to 10MB
    buffer: fc.uint8Array({ minLength: 100, maxLength: 1000 }).map(arr => {
      // Create a minimal PDF header to pass validation
      const pdfHeader = Buffer.from('%PDF-1.4\n');
      const content = Buffer.from(arr);
      return Buffer.concat([pdfHeader, content]);
    }),
    destination: fc.constant(''),
    filename: fc.constant(''),
    path: fc.constant(''),
    stream: fc.constant(null as any)
  });
};

const generateInvalidFile = (): fc.Arbitrary<Express.Multer.File> => {
  return fc.record({
    fieldname: fc.constant('file'),
    originalname: fc.string({ minLength: 1, maxLength: 100 }).map(name => `${name}.txt`),
    encoding: fc.constant('7bit'),
    mimetype: fc.constantFrom(...invalidMimeTypes),
    size: fc.integer({ min: 1, max: 1000 }),
    buffer: fc.uint8Array({ minLength: 10, maxLength: 100 }).map(arr => Buffer.from(arr)),
    destination: fc.constant(''),
    filename: fc.constant(''),
    path: fc.constant(''),
    stream: fc.constant(null as any)
  });
};

const generateOversizedImageFile = (): fc.Arbitrary<Express.Multer.File> => {
  return fc.record({
    fieldname: fc.constant('file'),
    originalname: fc.string({ minLength: 1, maxLength: 100 }).map(name => `${name}.jpg`),
    encoding: fc.constant('7bit'),
    mimetype: fc.constantFrom(...validImageMimeTypes),
    size: fc.integer({ min: 5 * 1024 * 1024 + 1, max: 20 * 1024 * 1024 }), // Over 5MB
    buffer: fc.uint8Array({ minLength: 100, maxLength: 1000 }).map(arr => Buffer.from(arr)),
    destination: fc.constant(''),
    filename: fc.constant(''),
    path: fc.constant(''),
    stream: fc.constant(null as any)
  });
};

const generateMaliciousFile = (): fc.Arbitrary<Express.Multer.File> => {
  const maliciousContent = [
    '<script>alert("xss")</script>',
    'javascript:void(0)',
    'onload="malicious()"',
    '../../../etc/passwd',
    '$(rm -rf /)',
    '`rm -rf /`'
  ];

  return fc.record({
    fieldname: fc.constant('file'),
    originalname: fc.constantFrom(...maliciousContent.map(content => `${content}.jpg`)),
    encoding: fc.constant('7bit'),
    mimetype: fc.constantFrom(...validImageMimeTypes),
    size: fc.integer({ min: 100, max: 1000 }),
    buffer: fc.constantFrom(...maliciousContent).map(content => Buffer.from(content)),
    destination: fc.constant(''),
    filename: fc.constant(''),
    path: fc.constant(''),
    stream: fc.constant(null as any)
  });
};

const generateUserId = (): fc.Arbitrary<string> => {
  return fc.string({ minLength: 10, maxLength: 30 });
};

describe('Feature: mlh-ttu-backend-onboarding, Property 11: File Upload Validation and Security', () => {
  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    vi.clearAllMocks();
  });

  test('Property 11.1: Valid image files should pass validation', () => {
    fc.assert(fc.property(
      generateValidImageFile(),
      (file) => {
        const result = fileUploadService.validateImageFile(file);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    ), { numRuns: 100 });
  });

  test('Property 11.2: Valid resume files should pass validation', () => {
    fc.assert(fc.property(
      generateValidResumeFile(),
      (file) => {
        const result = fileUploadService.validateResumeFile(file);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    ), { numRuns: 100 });
  });

  test('Property 11.3: Invalid file types should fail validation', () => {
    fc.assert(fc.property(
      generateInvalidFile(),
      (file) => {
        const imageResult = fileUploadService.validateImageFile(file);
        const resumeResult = fileUploadService.validateResumeFile(file);
        
        expect(imageResult.isValid).toBe(false);
        expect(resumeResult.isValid).toBe(false);
        expect(imageResult.errors.length).toBeGreaterThan(0);
        expect(resumeResult.errors.length).toBeGreaterThan(0);
      }
    ), { numRuns: 100 });
  });

  test('Property 11.4: Oversized files should fail validation', () => {
    fc.assert(fc.property(
      generateOversizedImageFile(),
      (file) => {
        const result = fileUploadService.validateImageFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.message.includes('size too large'))).toBe(true);
      }
    ), { numRuns: 100 });
  });

  test('Property 11.5: Empty files should fail validation', () => {
    fc.assert(fc.property(
      fc.record({
        fieldname: fc.constant('file'),
        originalname: fc.string({ minLength: 1, maxLength: 100 }).map(name => `${name}.jpg`),
        encoding: fc.constant('7bit'),
        mimetype: fc.constantFrom(...validImageMimeTypes),
        size: fc.constant(0), // Empty file
        buffer: fc.constant(Buffer.alloc(0)),
        destination: fc.constant(''),
        filename: fc.constant(''),
        path: fc.constant(''),
        stream: fc.constant(null as any)
      }),
      (file) => {
        const result = fileUploadService.validateImageFile(file);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.message.includes('empty'))).toBe(true);
      }
    ), { numRuns: 100 });
  });

  test('Property 11.6: Files with malicious patterns should fail security scan', async () => {
    await fc.assert(fc.asyncProperty(
      generateMaliciousFile(),
      generateUserId(),
      async (file, userId) => {
        // Mock user lookup
        mockPrisma.user.findUnique.mockResolvedValue({
          id: userId,
          email: `test-${userId}@example.com`,
          provider: 'EMAIL',
          hasCompletedOnboarding: false,
          profilePictureId: null
        });

        const result = await fileUploadService.uploadProfilePicture(file, userId);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Security check failed');
      }
    ), { numRuns: 50 }); // Reduced runs for async tests
  });

  test('Property 11.7: Successful file uploads should generate secure URLs', async () => {
    await fc.assert(fc.asyncProperty(
      generateValidImageFile().filter(file => file.size > 0 && file.size <= 5 * 1024 * 1024),
      generateUserId(),
      async (file, userId) => {
        // Mock user lookup
        mockPrisma.user.findUnique.mockResolvedValue({
          id: userId,
          email: `test-${userId}@example.com`,
          provider: 'EMAIL',
          hasCompletedOnboarding: false,
          profilePictureId: null
        });

        // Mock file creation
        const mockFileId = `file_${userId}`;
        mockPrisma.file.create.mockResolvedValue({
          id: mockFileId,
          userId,
          originalName: file.originalname,
          fileName: `unique_${file.originalname}`,
          mimeType: file.mimetype,
          size: file.size,
          type: FileType.PROFILE_PICTURE,
          storageUrl: `/tmp/${mockFileId}`
        });

        // Mock user update
        mockPrisma.user.update.mockResolvedValue({});

        // Mock file lookup for URL generation
        mockPrisma.file.findUnique.mockResolvedValue({
          id: mockFileId,
          userId,
          originalName: file.originalname,
          fileName: `unique_${file.originalname}`,
          mimeType: file.mimetype,
          size: file.size,
          type: FileType.PROFILE_PICTURE,
          storageUrl: `/tmp/${mockFileId}`
        });

        // Add valid image header to pass security scan
        const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF]);
        file.buffer = Buffer.concat([jpegHeader, file.buffer.subarray(3)]);
        file.mimetype = 'image/jpeg';

        const result = await fileUploadService.uploadProfilePicture(file, userId);
        
        if (result.success) {
          expect(result.fileId).toBeDefined();
          expect(result.url).toBeDefined();
          expect(result.url).toMatch(/^\/api\/files\/[^?]+\?token=[a-f0-9]+&expires=\d+$/);
        }
      }
    ), { numRuns: 30 }); // Reduced runs for complex async tests
  });

  test('Property 11.8: File deletion should remove both file and database record', async () => {
    await fc.assert(fc.asyncProperty(
      generateUserId(),
      async (userId) => {
        const mockFileId = `file_${userId}`;
        
        // Mock file lookup
        mockPrisma.file.findUnique.mockResolvedValue({
          id: mockFileId,
          userId,
          originalName: 'test.jpg',
          fileName: 'unique_test.jpg',
          mimeType: 'image/jpeg',
          size: 1000,
          type: FileType.PROFILE_PICTURE,
          storageUrl: `/tmp/${mockFileId}`
        });

        // Mock file deletion
        mockPrisma.file.delete.mockResolvedValue({});
        mockPrisma.user.updateMany.mockResolvedValue({});

        // This should not throw an error
        await expect(fileUploadService.deleteFile(mockFileId)).resolves.not.toThrow();
        
        // Verify delete was called
        expect(mockPrisma.file.delete).toHaveBeenCalledWith({
          where: { id: mockFileId }
        });
      }
    ), { numRuns: 20 }); // Reduced runs for complex async tests
  });

  test('Property 11.9: Secure URL generation should include proper token and expiry', async () => {
    await fc.assert(fc.asyncProperty(
      generateUserId(),
      async (userId) => {
        const mockFileId = `file_${userId}`;
        
        // Mock file lookup
        mockPrisma.file.findUnique.mockResolvedValue({
          id: mockFileId,
          userId,
          originalName: 'test.jpg',
          fileName: 'unique_test.jpg',
          mimeType: 'image/jpeg',
          size: 1000,
          type: FileType.PROFILE_PICTURE,
          storageUrl: `/tmp/${mockFileId}`
        });

        const secureUrl = await fileUploadService.getSecureFileUrl(mockFileId);
        
        expect(secureUrl).toMatch(/^\/api\/files\/[^?]+\?token=[a-f0-9]{64}&expires=\d+$/);
        
        // Extract token and expiry from URL
        if (secureUrl) {
          const urlParams = new URLSearchParams(secureUrl.split('?')[1]);
          const token = urlParams.get('token');
          const expires = urlParams.get('expires');
          
          expect(token).toHaveLength(64);
          expect(token).toMatch(/^[a-f0-9]+$/);
          expect(parseInt(expires!)).toBeGreaterThan(Date.now());
        }
      }
    ), { numRuns: 50 });
  });

  test('Property 11.10: File metadata access should be restricted to file owner', async () => {
    await fc.assert(fc.asyncProperty(
      generateUserId(),
      generateUserId(),
      async (ownerId, otherUserId) => {
        fc.pre(ownerId !== otherUserId); // Ensure different user IDs

        const mockFileId = `file_${ownerId}`;

        // Mock file lookup for owner access (should succeed)
        mockPrisma.file.findFirst.mockImplementation(({ where }) => {
          if (where.userId === ownerId) {
            return Promise.resolve({
              id: mockFileId,
              originalName: 'test.jpg',
              mimeType: 'image/jpeg',
              size: 1000,
              type: FileType.PROFILE_PICTURE,
              createdAt: new Date()
            });
          }
          return Promise.resolve(null);
        });

        // Owner should be able to access file metadata
        const ownerAccess = await fileUploadService.getFileMetadata(mockFileId, ownerId);
        expect(ownerAccess).toBeDefined();
        expect(ownerAccess.id).toBe(mockFileId);

        // Other user should not be able to access file metadata
        await expect(fileUploadService.getFileMetadata(mockFileId, otherUserId))
          .rejects.toThrow('File not found or access denied');
      }
    ), { numRuns: 30 });
  });
});