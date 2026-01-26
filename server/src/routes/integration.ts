/**
 * Integration API Routes
 * 
 * Provides unified endpoints that orchestrate multiple services
 * for complete user flows with proper error handling.
 */

import express, { Request, Response } from 'express';
import multer from 'multer';
import { IntegrationService } from '../services/integration';
import { requireAuth } from '../middleware/auth';
import { 
  asyncHandler, 
  createSuccessResponse, 
  createErrorResponse,
  AppError 
} from '../middleware/errorHandler';
import { AuthProvider } from '../types/index';

const router = express.Router();
const integrationService = new IntegrationService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 2 // Max 2 files (profile picture + resume)
  }
});

/**
 * Complete onboarding flow with file uploads and duplicate detection
 * POST /api/integration/onboarding
 */
router.post('/onboarding', 
  requireAuth,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Extract form data
    const {
      firstName,
      lastName,
      major,
      rNumber,
      universityLevel,
      aspiredPosition,
      githubUrl,
      linkedinUrl,
      twitterUrl,
      technologySkills
    } = req.body;

    // Parse technology skills if it's a string
    let parsedTechnologySkills: string[] = [];
    if (technologySkills) {
      parsedTechnologySkills = Array.isArray(technologySkills) 
        ? technologySkills 
        : JSON.parse(technologySkills);
    }

    // Prepare onboarding data
    const onboardingData = {
      firstName,
      lastName,
      major,
      rNumber,
      universityLevel,
      aspiredPosition,
      githubUrl,
      linkedinUrl,
      twitterUrl,
      technologySkills: parsedTechnologySkills,
      profilePicture: files?.profilePicture?.[0],
      resume: files?.resume?.[0]
    };

    // Complete onboarding flow
    const result = await integrationService.completeOnboardingFlow(userId, onboardingData);

    if (!result.success) {
      if (result.error === 'DUPLICATE_R_NUMBER') {
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_R_NUMBER',
          data: result.data,
          message: 'An account with this R Number already exists'
        });
      }
      
      return res.status(400).json(createErrorResponse(result.error || 'Onboarding failed'));
    }

    res.json(createSuccessResponse(result.data, 'Onboarding completed successfully'));
  })
);

/**
 * Handle account linking
 * POST /api/integration/link-account
 */
router.post('/link-account',
  asyncHandler(async (req: Request, res: Response) => {
    const { linkingToken, method, password } = req.body;

    if (!linkingToken || !method) {
      throw new AppError('Linking token and method are required', 400);
    }

    if (method === 'password' && !password) {
      throw new AppError('Password is required for password linking method', 400);
    }

    const result = await integrationService.processAccountLinking(linkingToken, method, password);

    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error || 'Account linking failed'));
    }

    res.json(createSuccessResponse(result.data, 'Account linked successfully'));
  })
);

/**
 * Update user profile with file uploads
 * PUT /api/integration/profile
 */
router.put('/profile',
  requireAuth,
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    
    // Extract update data
    const updateData = {
      ...req.body,
      profilePicture: files?.profilePicture?.[0],
      resume: files?.resume?.[0]
    };

    // Parse technology skills if provided
    if (updateData.technologySkills && typeof updateData.technologySkills === 'string') {
      updateData.technologySkills = JSON.parse(updateData.technologySkills);
    }

    const result = await integrationService.updateUserProfile(userId, updateData);

    if (!result.success) {
      return res.status(400).json(createErrorResponse(result.error || 'Profile update failed'));
    }

    res.json(createSuccessResponse(result.data, 'Profile updated successfully'));
  })
);

/**
 * Get complete user profile with file URLs
 * GET /api/integration/profile
 */
router.get('/profile',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const result = await integrationService.getCompleteUserProfile(userId);

    if (!result.success) {
      return res.status(404).json(createErrorResponse(result.error || 'Profile not found'));
    }

    res.json(createSuccessResponse(result.data));
  })
);

/**
 * Complete authentication flow
 * POST /api/integration/auth/complete
 */
router.post('/auth/complete',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, provider, oauthData } = req.body;

    if (!email || !provider) {
      throw new AppError('Email and provider are required', 400);
    }

    if (!Object.values(AuthProvider).includes(provider)) {
      throw new AppError('Invalid authentication provider', 400);
    }

    const result = await integrationService.completeAuthenticationFlow(email, provider, oauthData);

    if (!result.success) {
      return res.status(401).json(createErrorResponse(result.error || 'Authentication failed'));
    }

    // Set session cookie
    res.cookie('session', result.data!.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'lax'
    });

    res.json(createSuccessResponse({
      user: result.data!.user,
      redirectTo: result.data!.redirectTo
    }, 'Authentication successful'));
  })
);

/**
 * Logout with session cleanup
 * POST /api/integration/auth/logout
 */
router.post('/auth/logout',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const sessionToken = req.cookies.session;

    if (sessionToken) {
      await integrationService.logout(sessionToken);
    }

    // Clear session cookie
    res.clearCookie('session');

    res.json(createSuccessResponse(null, 'Logged out successfully'));
  })
);

/**
 * System health check
 * GET /api/integration/health
 */
router.get('/health',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await integrationService.healthCheck();

    const statusCode = result.success ? 200 : 503;
    
    res.status(statusCode).json({
      success: result.success,
      data: result.data,
      error: result.error,
      timestamp: new Date().toISOString()
    });
  })
);

/**
 * Validate current session
 * GET /api/integration/auth/me
 */
router.get('/auth/me',
  asyncHandler(async (req: Request, res: Response) => {
    const sessionToken = req.cookies.session;

    if (!sessionToken) {
      return res.status(401).json(createErrorResponse('No session found', 401));
    }

    const result = await integrationService.validateUserSession(sessionToken);

    if (!result.success) {
      res.clearCookie('session');
      return res.status(401).json(createErrorResponse(result.error || 'Invalid session', 401));
    }

    res.json(createSuccessResponse(result.data));
  })
);

export default router;