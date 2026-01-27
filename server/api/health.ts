import { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'OK',
    message: 'Health check passed',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown'
  });
}