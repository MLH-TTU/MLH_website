import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyCode, 
  incrementAttempts, 
  cleanupFailedVerification 
} from '@/lib/services/ttuEmailVerification';

export async function POST(request: NextRequest) {
  try {
    const { uid, code } = await request.json();

    if (!uid || !code) {
      return NextResponse.json(
        { error: 'UID and code are required' },
        { status: 400 }
      );
    }

    // Verify the code
    const isValid = await verifyCode(uid, code);

    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        verified: true 
      });
    } else {
      // Increment attempts
      const attempts = await incrementAttempts(uid);
      const remainingAttempts = 3 - attempts;

      // If max attempts reached, cleanup account
      if (attempts >= 3) {
        await cleanupFailedVerification(uid);
        return NextResponse.json(
          { 
            error: 'Maximum verification attempts exceeded. Your account has been removed. Please sign up again.',
            accountDeleted: true,
            remainingAttempts: 0
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Invalid verification code. Please try again.',
          verified: false,
          remainingAttempts
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify code' },
      { status: 500 }
    );
  }
}
