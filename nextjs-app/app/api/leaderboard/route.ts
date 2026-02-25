import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

/**
 * GET /api/leaderboard
 * Get top users by points
 * 
 * Query parameters:
 * - limit: number (optional, default: 3, max: 10)
 * 
 * Response:
 * {
 *   success: true;
 *   data: Array<{
 *     id: string;
 *     firstName: string;
 *     lastName: string;
 *     photoURL?: string;
 *     points: number;
 *     attendedEvents: number;
 *   }>;
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    
    // Parse and validate limit (default: 3, max: 10)
    let limit = 3;
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 10);
      }
    }
    
    const db = getAdminFirestore();
    
    // Query all users who have completed onboarding
    const snapshot = await db.collection('users')
      .where('hasCompletedOnboarding', '==', true)
      .get();
    
    // Get all users and sort by points in memory
    const allUsers = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        firstName: data.firstName || 'Anonymous',
        lastName: data.lastName || '',
        photoURL: data.photoURL || null,
        points: data.points || 0,
        attendedEvents: data.attendedEvents?.length || 0,
      };
    });
    
    // Sort by points (descending) and take top N
    const leaderboard = allUsers
      .sort((a, b) => b.points - a.points)
      .slice(0, limit);
    
    return NextResponse.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    console.error('Error getting leaderboard:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'GET_LEADERBOARD_ERROR',
          message: error.message || 'Failed to get leaderboard',
        },
      },
      { status: 500 }
    );
  }
}
