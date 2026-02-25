import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { searchUsers } from '@/lib/services/user.service';

/**
 * GET /api/users/search
 * Search users by name or email (admin only)
 * 
 * Query parameters:
 * - q: string (required) - Search query
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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    // Validate query parameter
    if (!query) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required query parameter: q',
          },
        },
        { status: 400 }
      );
    }
    
    // Search users
    const users = await searchUsers(query);
    
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
    console.error('Error searching users:', error);
    
    return NextResponse.json(
      {
        error: {
          code: 'SEARCH_USERS_ERROR',
          message: error.message || 'Failed to search users',
        },
      },
      { status: 500 }
    );
  }
}
