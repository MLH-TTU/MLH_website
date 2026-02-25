import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { getTTUVerifiedUsers } from '@/lib/services/user.service';

/**
 * GET /api/admin/users
 * Get all TTU verified users (admin only)
 * 
 * Response:
 * {
 *   success: true;
 *   data: User[];
 * }
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const authResult = await requireAdmin(request);
  
  if (!authResult.success) {
    return createErrorResponse(authResult);
  }
  
  try {
    // Get all TTU verified users
    const users = await getTTUVerifiedUsers();
    
    // Convert Timestamps to ISO strings for JSON serialization
    const serializedUsers = users.map(user => ({
      ...user,
      createdAt: user.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: user.updatedAt?.toDate?.()?.toISOString() || null,
      attendedEvents: user.attendedEvents.map(event => ({
        ...event,
        eventDate: event.eventDate?.toDate?.()?.toISOString() || null,
        attendedAt: event.attendedAt?.toDate?.()?.toISOString() || null,
      })),
    }));
    
    return NextResponse.json({
      success: true,
      data: serializedUsers,
    });
  } catch (error: any) {
    console.error('Error getting users:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'GET_USERS_ERROR',
          message: error.message || 'Failed to get users',
        },
      },
      { status: 500 }
    );
  }
}
