import { NextRequest, NextResponse } from 'next/server';

// Cookie configuration
const COOKIE_NAME = 'AuthToken';
const COOKIE_SIGNATURE_NAME = 'AuthToken.sig';
const MAX_AGE = 60 * 60 * 24 * 5; // 5 days

// POST /api/auth/session - Set auth cookies
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing idToken' },
        { status: 400 }
      );
    }

    // Set the auth cookies
    const response = NextResponse.json({ success: true });

    // Set the token cookie
    response.cookies.set(COOKIE_NAME, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error setting auth session:', error);
    return NextResponse.json(
      { error: 'Failed to set auth session', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/session - Clear auth cookies
export async function DELETE() {
  try {
    const response = NextResponse.json({ success: true });

    // Clear the auth cookies
    response.cookies.set(COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    response.cookies.set(COOKIE_SIGNATURE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Error clearing auth session:', error);
    return NextResponse.json(
      { error: 'Failed to clear auth session', details: error.message },
      { status: 500 }
    );
  }
}
