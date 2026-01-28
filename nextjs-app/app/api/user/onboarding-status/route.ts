import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/services/userProfile.server';

// GET /api/user/onboarding-status?uid=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid parameter' },
        { status: 400 }
      );
    }

    // Get user profile using the service
    const userProfile = await getUserProfile(uid);

    if (!userProfile) {
      // User profile doesn't exist yet, needs onboarding
      return NextResponse.json({
        hasCompletedOnboarding: false,
        exists: false,
      });
    }
    
    return NextResponse.json({
      hasCompletedOnboarding: userProfile.hasCompletedOnboarding === true,
      exists: true,
    });
  } catch (error: any) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check onboarding status',
        details: error.message,
        hasCompletedOnboarding: false,
      },
      { status: 500 }
    );
  }
}
