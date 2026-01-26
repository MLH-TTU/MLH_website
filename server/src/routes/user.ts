import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ProfileService } from '../services/profile';
import { DuplicateDetectionService } from '../services/duplicateDetection';
import { requireAuth } from '../middleware/auth';
import { validateOnboardingData } from '../middleware/validation';

const router = Router();
const profileService = new ProfileService();
const duplicateDetectionService = new DuplicateDetectionService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Profile operations
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const profile = await profileService.getUserProfile(user.id);
    
    res.json(profile);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    console.log('Profile update request - user:', user.email);
    console.log('Profile update request - data:', req.body);
    
    const updatedProfile = await profileService.updateUserProfile(user.id, req.body);
    
    console.log('Profile update successful');
    res.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update user profile' 
    });
  }
});

router.post('/onboard', 
  requireAuth, 
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Parse FormData
    const onboardingData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      major: req.body.major,
      rNumber: req.body.rNumber,
      universityLevel: req.body.universityLevel,
      aspiredPosition: req.body.aspiredPosition,
      githubUrl: req.body.githubUrl,
      linkedinUrl: req.body.linkedinUrl,
      twitterUrl: req.body.twitterUrl,
      technologySkills: req.body.technologySkills ? JSON.parse(req.body.technologySkills) : [],
    };

    console.log('Onboard endpoint - received data:', onboardingData);

    // Check for duplicate R Number if provided
    if (onboardingData.rNumber) {
      const existingAccount = await duplicateDetectionService.findAccountByRNumber(onboardingData.rNumber);
      
      if (existingAccount && existingAccount.id !== user.id) {
        return res.status(409).json({
          error: 'Duplicate R Number detected',
          existingAccount: {
            id: existingAccount.id,
            email: existingAccount.email,
            firstName: existingAccount.firstName,
            lastName: existingAccount.lastName,
            rNumber: existingAccount.rNumber
          },
          message: 'You already have an account with this R Number. Do you want to use your existing account?'
        });
      }
    }

    const completedProfile = await profileService.completeOnboarding(user.id, onboardingData);
    
    res.json({
      message: 'Onboarding completed successfully',
      profile: completedProfile
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to complete onboarding' });
    }
  }
});

router.delete('/account', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Delete user account and all associated data
    await profileService.deleteUserAccount(user.id);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

// Duplicate detection and account linking
router.post('/check-duplicate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { rNumber } = req.body;
    
    if (!rNumber) {
      return res.status(400).json({ error: 'R Number is required' });
    }

    const existingAccount = await duplicateDetectionService.findAccountByRNumber(rNumber);
    
    if (existingAccount) {
      res.json({
        isDuplicate: true,
        existingAccount: {
          id: existingAccount.id,
          email: existingAccount.email,
          firstName: existingAccount.firstName,
          lastName: existingAccount.lastName,
          rNumber: existingAccount.rNumber
        }
      });
    } else {
      res.json({ isDuplicate: false });
    }
  } catch (error) {
    console.error('Check duplicate error:', error);
    res.status(500).json({ error: 'Failed to check for duplicate accounts' });
  }
});

router.post('/link-account', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { rNumber, password } = req.body;
    
    if (!rNumber) {
      return res.status(400).json({ error: 'R Number is required' });
    }

    const result = await duplicateDetectionService.linkAccountByRNumber(
      rNumber, 
      user.email, 
      user.provider,
      password
    );
    
    res.json({
      message: 'Account linked successfully',
      linkedAccount: result
    });
  } catch (error) {
    console.error('Link account error:', error);
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to link accounts' });
    }
  }
});

router.post('/reset-for-linking', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await duplicateDetectionService.sendPasswordResetForLinking(email);
    
    res.json({ 
      message: 'Password reset link sent to your email address',
      email: email
    });
  } catch (error) {
    console.error('Reset for linking error:', error);
    res.status(500).json({ error: 'Failed to send password reset link' });
  }
});

export default router;