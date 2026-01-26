import express, { Request, Response } from 'express';
import passport from 'passport';
import { AuthenticationService } from '../services/auth';
import { requireAuth } from '../middleware/auth';

const router = express.Router();
const authService = new AuthenticationService();

// Logging helper
const warning = (message: string) => {
  console.warn(`[WARNING] ${message}`);
};

// Configure passport strategies
authService.configureGoogleOAuth();
authService.configureMicrosoftOAuth();
authService.configureMagicLink();

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    // We'll use session validation instead of direct user lookup
    done(null, { id });
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google', (req: Request, res: Response, next) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  if (!clientId || clientId === 'placeholder-google-client-id' || clientId === 'your-actual-google-client-id') {
    // For development: create a mock user and redirect
    warning('Google OAuth not configured - using development bypass');
    
    // Create a temporary development user
    const mockUser = {
      id: 'dev-user-' + Date.now(),
      email: 'dev@example.com',
      provider: 'google',
      hasCompletedOnboarding: false
    };
    
    // Create session and redirect
    authService.createSession(mockUser as any).then(sessionToken => {
      res.cookie('token', sessionToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: sessionToken.expiresAt
      });
      
      res.redirect(`${process.env.CLIENT_URL}/onboarding`);
    }).catch(error => {
      console.error('Mock auth error:', error);
      res.status(500).json({ 
        error: 'Authentication failed. Please set up Google OAuth credentials.',
        setup: 'See OAUTH_SETUP.md for instructions'
      });
    });
    
    return;
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

router.get('/google/callback', 
  passport.authenticate('google', { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      console.log('OAuth callback - user:', user);
      
      if (!user) {
        console.log('OAuth callback - no user, redirecting to error');
        return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
      }

      console.log('OAuth callback - creating session for user:', user.email);
      const sessionToken = await authService.createSession(user);
      console.log('OAuth callback - session created, token:', sessionToken.token.substring(0, 20) + '...');
      
      const redirectUrl = authService.redirectBasedOnOnboarding(user);
      console.log('OAuth callback - redirect URL:', redirectUrl);
      console.log('OAuth callback - user hasCompletedOnboarding:', user.hasCompletedOnboarding);

      // Set cookie and redirect
      res.cookie('token', sessionToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: sessionToken.expiresAt,
        domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost',
        path: '/'
      });

      console.log('OAuth callback - cookie set, redirecting to:', redirectUrl);
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
    }
  }
);

// Microsoft OAuth routes
router.get('/microsoft', passport.authenticate('microsoft', {
  scope: ['user.read']
}));

router.get('/microsoft/callback',
  passport.authenticate('microsoft', { session: false }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
      }

      const sessionToken = await authService.createSession(user);
      const redirectUrl = authService.redirectBasedOnOnboarding(user);

      // Set cookie and redirect
      res.cookie('token', sessionToken.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: sessionToken.expiresAt
      });

      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Microsoft OAuth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
    }
  }
);

// Magic link routes
router.post('/magic-link', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email address required' });
    }

    await authService.generateMagicLink(email);
    
    res.json({ 
      message: 'Magic link sent to your email address',
      email: email
    });
  } catch (error) {
    console.error('Magic link generation error:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
});

router.get('/magic-link/verify', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Invalid magic link`);
    }

    const user = await authService.validateMagicLink(token);
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Invalid or expired magic link`);
    }

    const sessionToken = await authService.createSession(user);
    const redirectUrl = authService.redirectBasedOnOnboarding(user);

    // Set cookie and redirect
    res.cookie('token', sessionToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: sessionToken.expiresAt
    });

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Magic link verification error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/error?message=Authentication failed`);
  }
});

// Session management routes
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    console.log('Auth /me endpoint - user found:', user?.email);
    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        provider: user.provider,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        firstName: user.firstName,
        lastName: user.lastName,
        major: user.major,
        rNumber: user.rNumber,
        universityLevel: user.universityLevel,
        aspiredPosition: user.aspiredPosition,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        twitterUrl: user.twitterUrl,
        profilePictureId: user.profilePictureId,
        resumeId: user.resumeId,
        technologySkills: user.technologySkills
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

router.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    if (token) {
      await authService.destroySession(token);
    }

    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

export default router;