import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/middleware/auth';
import { createErrorResponse } from '@/lib/middleware/auth';
import { addPoints } from '@/lib/services/user.service';

/**
 * POST /api/admin/users/[id]/add-points
 * Add points to user (admin only)
 * 
 * Request body:
 * {
 *   points: number; // Points to add (can be negative)
 *   reason: string; // Reason for adjustment
 * }
 * 
 * Response:
 * {
 *   success: true;
 *   data: {
 *     newTotal: number;
 *   };
 * }
 */
export async function POST(
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
    const body = await request.json();
    
    // Validate required fields
    if (typeof body.points !== 'number') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing or invalid field: points (must be a number)',
          },
        },
        { status: 400 }
      );
    }
    
    if (!body.reason || typeof body.reason !== 'string') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing or invalid field: reason (must be a string)',
          },
        },
        { status: 400 }
      );
    }
    
    // Add points
    const newTotal = await addPoints(
      id,
      body.points,
      body.reason,
      authResult.userId!
    );
    
    return NextResponse.json({
      success: true,
      data: {
        newTotal,
      },
    });
  } catch (error: any) {
    console.error('Error adding points:', error);
    
    // Handle specific errors
    if (error.message === 'User not found') {
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
    
    return NextResponse.json(
      {
        error: {
          code: 'ADD_POINTS_ERROR',
          message: error.message || 'Failed to add points',
        },
      },
      { status: 500 }
    );
  }
}
