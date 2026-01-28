import { NextRequest, NextResponse } from 'next/server';
import { cleanupFailedVerification, hasCompletedOnboarding } from '@/lib/services/ttuEmailVerification';

/**
 * API route to cleanup incomplete accounts
 * Called when user leaves onboarding without completing verification
 */
export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json();

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    // Check if user has completed onboarding
    const isComplete = await hasCompletedOnboarding(uid);
    
    if (isComplete) {
      // User has completed onboarding, don't delete
      return NextResponse.json({ 
        success: true, 
        message: 'User has completed onboarding, no cleanup needed' 
      });
    }

    // User hasn't completed onboarding, clean up the account
    await cleanupFailedVerification(uid);

    return NextResponse.json({ 
      success: true, 
      message: 'Incomplete account cleaned up successfully' 
    });
  } catch (error: any) {
    console.error('Error cleaning up incomplete account:', error);
    // Don't return error to client - cleanup is best effort
    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup attempted' 
    });
  }
}
