import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { PrismaClient, User } from '@prisma/client';
import { AuthProvider } from '../types/index';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';
import { Request, Response, NextFunction } from 'express';

const prisma = new PrismaClient();

export interface SessionToken {
  token: string;
  expiresAt: Date;
}

export class AuthenticationService {
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    this.configureEmailTransporter();
  }

  private configureEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (error) {
      // In test environment, email transporter might not be available
      console.warn('Email transporter not configured:', error);
      this.emailTransporter = null;
    }
  }

  // OAuth provider configurations
  configureGoogleOAuth(): void {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5001';

    if (!clientId || !clientSecret || clientId === 'placeholder-google-client-id' || clientId === 'your-actual-google-client-id') {
      console.warn('Google OAuth not configured - using placeholder credentials');
      return;
    }

    passport.use(new GoogleStrategy({
      clientID: clientId,
      clientSecret: clientSecret,
      callbackURL: `${serverUrl}/auth/google/callback`
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        console.log('Google OAuth strategy - profile received:', profile.emails?.[0]?.value);
        
        const email = profile.emails?.[0]?.value;
        if (!email) {
          console.log('Google OAuth strategy - no email found in profile');
          return done(new Error('No email found in Google profile'), false);
        }

        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          console.log('Google OAuth strategy - creating new user for:', email);
          user = await prisma.user.create({
            data: {
              email,
              provider: AuthProvider.GOOGLE,
              hasCompletedOnboarding: false,
              lastLoginAt: new Date(),
            }
          });
          console.log('Google OAuth strategy - new user created:', user.id, 'hasCompletedOnboarding:', user.hasCompletedOnboarding);
        } else {
          console.log('Google OAuth strategy - existing user found:', user.id, 'hasCompletedOnboarding:', user.hasCompletedOnboarding);
          // Update last login time
          user = await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });
        }

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, false);
      }
    }));
  }

  configureMicrosoftOAuth(): void {
    passport.use(new MicrosoftStrategy({
      clientID: process.env.MICROSOFT_CLIENT_ID!,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
      callbackURL: `${process.env.SERVER_URL}/auth/microsoft/callback`,
      scope: ['user.read']
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Microsoft profile'), false);
        }

        let user = await prisma.user.findUnique({
          where: { email }
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              provider: AuthProvider.MICROSOFT,
              hasCompletedOnboarding: false,
              lastLoginAt: new Date(),
            }
          });
        } else {
          // Update last login time
          user = await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }));
  }

  configureMagicLink(): void {
    // Magic link configuration - generates and sends magic links via email
    // This method sets up the email transporter and validates configuration
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Email configuration missing for magic link authentication');
    }
  }

  // Session management
  async createSession(user: User): Promise<SessionToken> {
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        lastAccessedAt: new Date(),
      }
    });

    return { token, expiresAt };
  }

  async validateSession(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!session || session.expiresAt < new Date()) {
        // Clean up expired session
        if (session) {
          await prisma.session.delete({ where: { id: session.id } });
        }
        return null;
      }

      // Update last accessed time
      await prisma.session.update({
        where: { id: session.id },
        data: { lastAccessedAt: new Date() }
      });

      console.log('validateSession - user data:', {
        id: session.user.id,
        email: session.user.email,
        profilePictureId: session.user.profilePictureId,
        resumeId: session.user.resumeId
      });

      return session.user;
    } catch (error) {
      return null;
    }
  }

  async destroySession(token: string): Promise<void> {
    try {
      await prisma.session.delete({
        where: { token }
      });
    } catch (error) {
      // Session might not exist, which is fine
    }
  }

  // Magic link methods
  async generateMagicLink(email: string): Promise<string> {
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiry

    // Store magic link token (we'll use a simple approach with JWT for now)
    const magicToken = jwt.sign(
      { email, type: 'magic-link', exp: Math.floor(expiresAt.getTime() / 1000) },
      process.env.JWT_SECRET!
    );

    const magicLink = `${process.env.SERVER_URL}/auth/magic-link/verify?token=${magicToken}`;
    
    // Send email
    await this.sendMagicLinkEmail(email, magicLink);
    
    return magicToken;
  }

  async validateMagicLink(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      if (decoded.type !== 'magic-link') {
        return null;
      }

      const email = decoded.email;
      
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            provider: AuthProvider.EMAIL,
            hasCompletedOnboarding: false,
            lastLoginAt: new Date(),
          }
        });
      } else {
        // Update last login time
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() }
        });
      }

      return user;
    } catch (error) {
      return null;
    }
  }

  private async sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
    if (!this.emailTransporter) {
      // In test environment, just log instead of sending email
      console.log(`Would send magic link email to: ${email}`);
      return;
    }

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@mlhttu.com',
      to: email,
      subject: 'Your MLH TTU Login Link',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to MLH TTU!</h2>
          <p>Click the link below to sign in to your account:</p>
          <a href="${magicLink}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; margin: 16px 0;">
            Sign In to MLH TTU
          </a>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 15 minutes. If you didn't request this login link, you can safely ignore this email.
          </p>
        </div>
      `
    };

    await this.emailTransporter.sendMail(mailOptions);
  }

  // Route protection and redirection
  requireAuth(req: Request, res: Response, next: NextFunction): void {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    
    console.log('requireAuth - checking token:', token ? 'token present' : 'no token');
    console.log('requireAuth - cookies:', req.cookies);
    console.log('requireAuth - authorization header:', req.headers.authorization);
    
    if (!token) {
      console.log('requireAuth - no token found, returning 401');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    this.validateSession(token).then(user => {
      if (!user) {
        console.log('requireAuth - invalid session, returning 401');
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
      }
      
      console.log('requireAuth - valid session for user:', user.email);
      (req as any).user = user;
      next();
    }).catch((error) => {
      console.log('requireAuth - session validation error:', error);
      res.status(401).json({ error: 'Authentication failed' });
      return;
    });
  }

  redirectBasedOnOnboarding(user: User): string {
    if (!user.hasCompletedOnboarding) {
      return `${process.env.CLIENT_URL}/onboarding`;
    }
    return `${process.env.CLIENT_URL}/profile`;
  }
}