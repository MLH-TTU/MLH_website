import { Router, Request, Response } from 'express';
import multer from 'multer';
import { FileUploadService } from '../services/fileUpload';
import { requireAuth } from '../middleware/auth';

const router = Router();
const fileUploadService = new FileUploadService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// File operations
router.post('/profile-picture', requireAuth, upload.single('profilePicture'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;

    console.log('Profile picture upload request - user:', user.email);
    console.log('Profile picture upload request - file:', file ? file.originalname : 'no file');

    if (!file) {
      console.log('Profile picture upload - no file provided');
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const result = await fileUploadService.uploadProfilePicture(file, user.id);
    
    console.log('Profile picture upload successful');
    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Profile picture upload error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }
});

router.post('/resume', requireAuth, upload.single('resume'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded' 
      });
    }

    const result = await fileUploadService.uploadResume(file, user.id);
    
    res.json({
      success: true,
      message: 'Resume uploaded successfully',
      data: result
    });
  } catch (error) {
    console.error('Resume upload error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to upload resume' });
    }
  }
});

// Handle CORS preflight for file serving
router.options('/:fileId', (req: Request, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.status(200).end();
});

router.get('/:fileId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fileId } = req.params;

    console.log('File serving request - user:', user.email, 'fileId:', fileId);

    // Get file metadata and verify access
    const fileMetadata = await fileUploadService.getFileMetadata(fileId, user.id);
    
    if (!fileMetadata) {
      console.log('File metadata not found for fileId:', fileId);
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    console.log('File metadata found:', fileMetadata.originalName, fileMetadata.mimeType);

    // Get the actual file from storage
    const file = await fileUploadService.getFileForServing(fileId, user.id);
    
    if (!file) {
      console.log('File buffer not found for fileId:', fileId);
      return res.status(404).json({ error: 'File not found or access denied' });
    }

    console.log('File buffer loaded, size:', file.length);

    // Set CORS headers for cross-origin requests
    res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

    // Set appropriate headers for file serving
    res.setHeader('Content-Type', fileMetadata.mimeType);
    res.setHeader('Content-Length', fileMetadata.size);
    res.setHeader('Content-Disposition', `inline; filename="${fileMetadata.originalName}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour
    
    // Send the file
    res.send(file);
    console.log('File served successfully');
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({ error: 'Failed to get file' });
  }
});

router.delete('/:fileId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { fileId } = req.params;

    await fileUploadService.deleteFile(fileId, user.id);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({ error: 'File not found or access denied' });
    } else {
      res.status(500).json({ error: 'Failed to delete file' });
    }
  }
});

// File validation
router.post('/validate', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const file = req.file;
    const { fileType } = req.body; // 'profile-picture' or 'resume'

    if (!file) {
      return res.status(400).json({ error: 'No file provided for validation' });
    }

    if (!fileType || !['profile-picture', 'resume'].includes(fileType)) {
      return res.status(400).json({ error: 'Invalid file type specified' });
    }

    let validationResult;
    if (fileType === 'profile-picture') {
      validationResult = fileUploadService.validateImageFile(file);
    } else {
      validationResult = fileUploadService.validateResumeFile(file);
    }

    if (validationResult.isValid) {
      res.json({ 
        valid: true, 
        message: 'File validation passed',
        fileInfo: {
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype
        }
      });
    } else {
      res.status(400).json({ 
        valid: false, 
        errors: validationResult.errors 
      });
    }
  } catch (error) {
    console.error('File validation error:', error);
    res.status(500).json({ error: 'Failed to validate file' });
  }
});

export default router;