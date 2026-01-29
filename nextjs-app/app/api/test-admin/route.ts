import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = getAdminFirestore();
    
    // Try to write a test document
    const testRef = db.collection('_test').doc('admin-test');
    await testRef.set({
      test: true,
      timestamp: new Date().toISOString(),
    });
    
    // Try to read it back
    const doc = await testRef.get();
    
    // Clean up
    await testRef.delete();
    
    return NextResponse.json({
      success: true,
      message: 'Admin SDK is working correctly',
      data: doc.data(),
    });
  } catch (error: any) {
    console.error('Admin SDK test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
