import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { getUser } from '@/lib/services/user.service';

/**
 * GET /api/admin/users/[id]
 * Get user details (admin only)
 * 
 * Response:
 * {
 *   success: true;
 *   data: User;
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Verify admin authentication
  const authResult = await requireAdmin(request);
  
  if (!authResult.success) {
    return createErrorResponse(authResult);
  }
  
  try {
    const { id } = await params;
    
    // Get user
    const user = await getUser(id);
    
    if (!user) {
      return NextResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }
    
    // Convert Timestamps to ISO strings for JSON serialization
    const serializedUser = {
      ...user,
      createdAt: user.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: user.updatedAt?.toDate?.()?.toISOString() || null,
      attendedEvents: user.attendedEvents.map(event => ({
        ...event,
        eventDate: event.eventDate?.toDate?.()?.toISOString() || null,
        attendedAt: event.attendedAt?.toDate?.()?.toISOString() || null,
      })),
    };
    
    return NextResponse.json({
      success: true,
      data: serializedUser,
    });
  } catch (error: any) {
    console.error('Error getting user:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'GET_USER_ERROR',
          message: error.message || 'Failed to get user',
        },
      },
      { status: 500 }
    );
  }
}
