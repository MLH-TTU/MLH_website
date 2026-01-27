import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialize Prisma client if not already done
    if (!prisma) {
      prisma = new PrismaClient({
        log: ['error'],
        errorFormat: 'minimal'
      });
    }

    // Test database connection with timeout
    const connectionTest = Promise.race([
      prisma.$connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database connection timeout')), 5000)
      )
    ]);
    
    await connectionTest;
    
    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'unknown'
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(503).json({
      status: 'Service Unavailable',
      database: 'Disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'unknown'
    });
  }
}