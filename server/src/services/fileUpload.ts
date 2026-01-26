import { PrismaClient } from '@prisma/client';
import { FileType, FileUploadResult, ValidationResult } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private readonly maxProfilePictureSize = 5 * 1024 * 1024; // 5MB
  private readonly maxResumeSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
  private readonly allowedResumeTypes = ['application/pdf'];
  
  // Security patterns for malicious content detection
  private readonly maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /%3Cscript/gi,
    /%3C%2Fscript%3E/gi,
    /\x00/g, // null bytes
    /\.\.\/|\.\.\\/, // path traversal
    /\$\(/g, // potential shell injection
    /`[^`]*`/g, // backticks for command execution
  ];

  constructor() {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  // Enhanced malicious content scanning
  private async scanForMaliciousContent(file: Express.Multer.File): Promise<ValidationResult> {
    const errors: Array<{ field: string; message: string }> = [];

    try {
      // Check file size for potential zip bombs or excessive size
      if (file.size === 0) {
        errors.push({
          field: 'file',
          message: 'File is empty or corrupted'
        });
        return { isValid: false, errors };
      }

      // Check filename for malicious patterns
      const filename = file.originalname.toLowerCase();
      if (this.containsMaliciousPattern(filename)) {
        errors.push({
          field: 'file',
          message: 'Filename contains potentially malicious content'
        });
      }

      // For text-based files (like some PDFs), scan content
      if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('text/')) {
        const content = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 10000)); // First 10KB
        if (this.containsMaliciousPattern(content)) {
          errors.push({
            field: 'file',
            message: 'File content contains potentially malicious patterns'
          });
        }
      }

      // Check for executable file signatures in the buffer
      if (this.hasExecutableSignature(file.buffer)) {
        errors.push({
          field: 'file',
          message: 'File appears to contain executable code'
        });
      }

      // Validate file header matches declared MIME type
      if (!this.validateFileHeader(file.buffer, file.mimetype)) {
        errors.push({
          field: 'file',
          message: 'File type does not match file content'
        });
      }

    } catch (error) {
      errors.push({
        field: 'file',
        message: 'Error occurred during security scan'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private containsMaliciousPattern(content: string): boolean {
    return this.maliciousPatterns.some(pattern => pattern.test(content));
  }

  private hasExecutableSignature(buffer: Buffer): boolean {
    // Check for common executable file signatures
    const signatures = [
      [0x4D, 0x5A], // PE executable (MZ)
      [0x7F, 0x45, 0x4C, 0x46], // ELF executable
      [0xCA, 0xFE, 0xBA, 0xBE], // Mach-O executable
      [0xFE, 0xED, 0xFA, 0xCE], // Mach-O executable (reverse)
      [0x50, 0x4B, 0x03, 0x04], // ZIP (could contain executables)
    ];

    return signatures.some(sig => {
      if (buffer.length < sig.length) return false;
      return sig.every((byte, index) => buffer[index] === byte);
    });
  }

  private validateFileHeader(buffer: Buffer, mimeType: string): boolean {
    if (buffer.length < 4) return false;

    const header = buffer.subarray(0, 10);
    
    switch (mimeType) {
      case 'image/jpeg':
        return header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF;
      case 'image/png':
        return header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47;
      case 'image/webp':
        return header.subarray(0, 4).toString() === 'RIFF' && header.subarray(8, 12).toString() === 'WEBP';
      case 'application/pdf':
        return header.subarray(0, 4).toString() === '%PDF';
      default:
        return true; // Allow unknown types to pass header validation
    }
  }

  // Enhanced file type and size validation
  validateImageFile(file: Express.Multer.File): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!this.allowedImageTypes.includes(file.mimetype)) {
      errors.push({
        field: 'file',
        message: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      });
    }

    if (file.size > this.maxProfilePictureSize) {
      errors.push({
        field: 'file',
        message: `File size too large. Maximum size is ${this.maxProfilePictureSize / (1024 * 1024)}MB.`
      });
    }

    if (file.size === 0) {
      errors.push({
        field: 'file',
        message: 'File is empty'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateResumeFile(file: Express.Multer.File): ValidationResult {
    const errors: Array<{ field: string; message: string }> = [];

    if (!this.allowedResumeTypes.includes(file.mimetype)) {
      errors.push({
        field: 'file',
        message: 'Invalid file type. Only PDF files are allowed for resumes.'
      });
    }

    if (file.size > this.maxResumeSize) {
      errors.push({
        field: 'file',
        message: `File size too large. Maximum size is ${this.maxResumeSize / (1024 * 1024)}MB.`
      });
    }

    if (file.size === 0) {
      errors.push({
        field: 'file',
        message: 'File is empty'
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate unique filename with security considerations
  private generateSecureFilename(originalName: string): string {
    const ext = path.extname(originalName).toLowerCase();
    const uuid = uuidv4();
    const timestamp = Date.now();
    
    // Sanitize extension to prevent path traversal
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '');
    
    return `${uuid}_${timestamp}${safeExt}`;
  }

  // Store file securely with unique naming
  private async storeFile(file: Express.Multer.File, userId: string, fileType: FileType): Promise<string> {
    const secureFilename = this.generateSecureFilename(file.originalname);
    const filePath = path.join(this.uploadDir, secureFilename);
    
    console.log('storeFile - storing file:', secureFilename, 'for user:', userId);
    
    // Ensure the file path is within the upload directory (prevent path traversal)
    const resolvedPath = path.resolve(filePath);
    const resolvedUploadDir = path.resolve(this.uploadDir);
    
    if (!resolvedPath.startsWith(resolvedUploadDir)) {
      throw new Error('Invalid file path detected');
    }
    
    // Write file to disk
    await fs.writeFile(filePath, file.buffer);
    console.log('storeFile - file written to disk:', filePath);
    
    // Store file metadata in database
    const fileRecord = await prisma.file.create({
      data: {
        userId,
        originalName: file.originalname,
        fileName: secureFilename,
        mimeType: file.mimetype,
        size: file.size,
        type: fileType,
        storageUrl: filePath
      }
    });

    console.log('storeFile - file record created in database:', fileRecord.id);
    return fileRecord.id;
  }

  // Upload profile picture with enhanced validation and security
  async uploadProfilePicture(file: Express.Multer.File, userId: string): Promise<FileUploadResult> {
    try {
      console.log('uploadProfilePicture - starting upload for user:', userId);
      
      // Validate file type and size
      const validation = this.validateImageFile(file);
      if (!validation.isValid) {
        console.log('uploadProfilePicture - validation failed:', validation.errors);
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      // Scan for malicious content
      const securityScan = await this.scanForMaliciousContent(file);
      if (!securityScan.isValid) {
        console.log('uploadProfilePicture - security scan failed:', securityScan.errors);
        return {
          success: false,
          error: `Security check failed: ${securityScan.errors.map(e => e.message).join(', ')}`
        };
      }

      // Delete existing profile picture if it exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { profilePictureId: true }
      });

      console.log('uploadProfilePicture - existing user:', existingUser);

      if (existingUser?.profilePictureId) {
        console.log('uploadProfilePicture - deleting existing profile picture:', existingUser.profilePictureId);
        await this.deleteFile(existingUser.profilePictureId);
      }

      // Store new file
      const fileId = await this.storeFile(file, userId, FileType.PROFILE_PICTURE);
      console.log('uploadProfilePicture - new file stored with ID:', fileId);
      
      // Update user record with new profile picture
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profilePictureId: fileId }
      });

      console.log('uploadProfilePicture - user updated, profilePictureId:', updatedUser.profilePictureId);

      // Generate secure URL
      const url = await this.getSecureFileUrl(fileId);

      return {
        success: true,
        fileId,
        url: url || undefined
      };
    } catch (error) {
      console.error('uploadProfilePicture - error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during file upload'
      };
    }
  }

  // Upload resume with enhanced validation and security
  async uploadResume(file: Express.Multer.File, userId: string): Promise<FileUploadResult> {
    try {
      // Validate file type and size
      const validation = this.validateResumeFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        };
      }

      // Scan for malicious content
      const securityScan = await this.scanForMaliciousContent(file);
      if (!securityScan.isValid) {
        return {
          success: false,
          error: `Security check failed: ${securityScan.errors.map(e => e.message).join(', ')}`
        };
      }

      // Delete existing resume if it exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { resumeId: true }
      });

      if (existingUser?.resumeId) {
        await this.deleteFile(existingUser.resumeId);
      }

      // Store new file
      const fileId = await this.storeFile(file, userId, FileType.RESUME);
      
      // Update user record with new resume
      await prisma.user.update({
        where: { id: userId },
        data: { resumeId: fileId }
      });

      // Generate secure URL
      const url = await this.getSecureFileUrl(fileId);

      return {
        success: true,
        fileId,
        url: url || undefined
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during file upload'
      };
    }
  }

  // Generate secure URL for file access with enhanced security
  async getSecureFileUrl(fileId: string, userId?: string): Promise<string | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      return null;
    }

    // Check if user has access to this file
    if (userId && file.userId !== userId) {
      return null; // Access denied
    }

    // Generate a cryptographically secure token for file access
    const tokenData = {
      fileId,
      userId: file.userId,
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    };
    
    const token = crypto
      .createHash('sha256')
      .update(JSON.stringify(tokenData))
      .digest('hex');
    
    const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    // In a production environment, you would store this token in a cache (Redis) with expiry
    // For now, we'll return a URL with the file ID and a secure token
    return `/api/files/${fileId}?token=${token}&expires=${expiry}`;
  }

  // Verify secure file access token
  async verifyFileAccess(fileId: string, token: string, expires: string): Promise<boolean> {
    try {
      const expiryTime = parseInt(expires);
      if (Date.now() > expiryTime) {
        return false; // Token expired
      }

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return false; // File not found
      }

      // In a production environment, you would verify the token against stored tokens in cache
      // For now, we'll do a basic validation
      return token.length === 64 && /^[a-f0-9]+$/.test(token);
    } catch {
      return false;
    }
  }

  // Delete file from storage and database with comprehensive error handling
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    const file = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Check if user has access to delete this file
    if (userId && file.userId !== userId) {
      throw new Error('File not found or access denied');
    }

    try {
      // Verify file path is within upload directory before deletion
      const resolvedPath = path.resolve(file.storageUrl);
      const resolvedUploadDir = path.resolve(this.uploadDir);
      
      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        throw new Error('Invalid file path for deletion');
      }

      // Delete physical file
      await fs.unlink(file.storageUrl);
    } catch (error) {
      // Log error but continue with database cleanup
      console.error('Error deleting physical file:', error);
    }

    // Delete database record
    await prisma.file.delete({
      where: { id: fileId }
    });

    // Update user records if this was a profile picture or resume
    if (file.type === FileType.PROFILE_PICTURE) {
      await prisma.user.updateMany({
        where: { profilePictureId: fileId },
        data: { profilePictureId: null }
      });
    } else if (file.type === FileType.RESUME) {
      await prisma.user.updateMany({
        where: { resumeId: fileId },
        data: { resumeId: null }
      });
    }
  }

  // Get file metadata for secure access
  async getFileMetadata(fileId: string, userId: string): Promise<any> {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: userId // Ensure user can only access their own files
      },
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        type: true,
        createdAt: true
      }
    });

    if (!file) {
      throw new Error('File not found or access denied');
    }

    return file;
  }

  // Get file buffer for serving
  async getFileForServing(fileId: string, userId: string): Promise<Buffer | null> {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        userId: userId // Ensure user can only access their own files
      }
    });

    if (!file) {
      return null;
    }

    try {
      // Verify file path is within upload directory (security check)
      const resolvedPath = path.resolve(file.storageUrl);
      const resolvedUploadDir = path.resolve(this.uploadDir);
      
      if (!resolvedPath.startsWith(resolvedUploadDir)) {
        throw new Error('Invalid file path detected');
      }

      // Read and return file buffer
      const fileBuffer = await fs.readFile(file.storageUrl);
      return fileBuffer;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }
}