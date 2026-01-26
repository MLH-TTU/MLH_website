import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

// Placeholder for validation middleware - to be implemented in task 4
export const validateOnboardingData = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement onboarding data validation
  next();
};

export const validateFileUpload = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement file upload validation
  next();
};