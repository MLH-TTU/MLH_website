import { NextRequest, NextResponse } from 'next/server';
// import { cleanupExpiredAccounts } from '@/lib/services/ttuEmailVerification';

/**
 * API route to clean up expired accounts
 * This endpoint should be called periodically (e.g., via a cron job)
 * 
 * For security, you should add authentication to this endpoint in production
 * (e.g., check for a secret token in the Authorization header)
 * 
 * NOTE: This functionality is currently disabled. 
 * Implement cleanupExpiredAccounts in ttuEmailVerification service if needed.
 */
export async function POST(_request: NextRequest) {
  try {
    // Optional: Add authentication check here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CLEANUP_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // const cleanedCount = await cleanupExpiredAccounts();
    
    return NextResponse.json({
      success: true,
      message: 'Cleanup endpoint is currently disabled',
      cleanedCount: 0,
    });
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clean up expired accounts',
      },
      { status: 500 }
    );
  }
}

// Allow GET requests for testing purposes
export async function GET(request: NextRequest) {
  return POST(request);
}
