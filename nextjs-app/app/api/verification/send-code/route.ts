import { NextRequest, NextResponse } from 'next/server';
import { sendVerificationCode } from '@/lib/services/ttuEmailVerification';

export async function POST(request: NextRequest) {
  try {
    const { ttuEmail, uid } = await request.json();

    if (!ttuEmail || !uid) {
      return NextResponse.json(
        { error: 'TTU email and UID are required' },
        { status: 400 }
      );
    }

    // Send verification code (no expiration timer needed)
    await sendVerificationCode(ttuEmail, uid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending verification code:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send verification code' },
      { status: 500 }
    );
  }
}
