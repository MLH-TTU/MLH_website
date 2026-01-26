import { Request, Response, NextFunction } from 'express';
import { AuthenticationService } from '../services/auth';

const authService = new AuthenticationService();

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  authService.requireAuth(req, res, next);
};

export const redirectBasedOnOnboarding = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (user) {
    const redirectUrl = authService.redirectBasedOnOnboarding(user);
    (req as any).redirectUrl = redirectUrl;
  }
  next();
};