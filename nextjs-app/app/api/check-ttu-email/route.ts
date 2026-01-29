import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { ttuEmail } = await request.json();

    if (!ttuEmail) {
      return NextResponse.json(
        { error: 'TTU email is required' },
        { status: 400 }
      );
    }

    // Validate TTU email format
    if (!ttuEmail.endsWith('@ttu.edu')) {
      return NextResponse.json(
        { error: 'Email must be a valid TTU email address (@ttu.edu)' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    
    // Query for existing TTU email
    const usersRef = db.collection('users');
    const querySnapshot = await usersRef
      .where('ttuEmail', '==', ttuEmail)
      .limit(1)
      .get();

    const exists = !querySnapshot.empty;

    return NextResponse.json({ exists });
  } catch (error: any) {
    console.error('Error checking TTU email:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check TTU email' },
      { status: 500 }
    );
  }
}
