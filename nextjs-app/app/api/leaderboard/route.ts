import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminStorage } from '@/lib/firebase/admin';

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
    const storage = getAdminStorage();
    
    // Query all users who have completed onboarding
    const snapshot = await db.collection('users')
      .where('hasCompletedOnboarding', '==', true)
      .get();
    
    // Get all users and sort by points in memory
    const allUsersPromises = snapshot.docs.map(async (doc) => {
      const data = doc.data();
      
      // Prioritize uploaded profile picture over Google photo
      let photoURL = data.photoURL || null;
      
      // If user uploaded a profile picture during onboarding, use that instead
      if (data.profilePictureId) {
        try {
          const bucket = storage.bucket();
          const file = bucket.file(data.profilePictureId);
          const [url] = await file.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
          });
          photoURL = url;
        } catch (error) {
          console.error('Error getting profile picture URL:', error);
          // Fall back to Google photo if storage fetch fails
        }
      }
      
      return {
        id: doc.id,
        firstName: data.firstName || 'Anonymous',
        lastName: data.lastName || '',
        photoURL,
        points: data.points || 0,
        attendedEvents: data.attendedEvents?.length || 0,
      };
    });
    
    const allUsers = await Promise.all(allUsersPromises);
    
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
