import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    message: 'Hello World from MLH TTU Chapter!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown'
  });
}