import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyCode, 
  incrementAttempts, 
  applyRateLimit,
  isRateLimited
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

    // Check if user is rate limited
    const rateLimited = await isRateLimited(uid);
    if (rateLimited) {
      return NextResponse.json(
        { 
          error: 'Too many failed attempts. Please wait a few minutes before trying again.',
          rateLimited: true,
          remainingAttempts: 0
        },
        { status: 429 }
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

      // If max attempts reached, apply rate limit
      if (attempts >= 3) {
        await applyRateLimit(uid);
        return NextResponse.json(
          { 
            error: 'Maximum verification attempts exceeded. Please wait 5 minutes before trying again.',
            rateLimited: true,
            remainingAttempts: 0
          },
          { status: 429 }
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
