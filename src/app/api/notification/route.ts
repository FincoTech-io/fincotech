import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../utils/database';
import { NotificationService } from '../../../utils/notificationService';
import { getUserFromSession } from '../../../utils/serverAuth';
import { jwtVerify } from 'jose';
import { connectToDatabase } from '@/utils/db';

/**
 * GET /api/notification
 * Get notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: THIS AUTH is the one that works
    // Get token from Authorization header (for mobile apps)
    const authHeader = request.headers.get('Authorization');
    let token = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    // Fallback to cookies (for web apps)
    if (!token) {
      token = request.cookies.get('auth_token')?.value || null;
    }

    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token provided'
        },
        { status: 401 }
      );
    }

    // Verify the token
    const secretKey = new TextEncoder().encode(
      process.env.JWT_SECRET as string
    );

    const { payload } = await jwtVerify(token, secretKey);

    // Extract userId from token payload
    const userId = payload.userId as string;

    // Connect to database
    await connectToDatabase();


    // Get notifications
    const { notifications, totalCount, unreadCount } = await NotificationService.getUserNotifications(
      userId
    );

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        totalCount,
        unreadCount,
        hasUnread: unreadCount > 0,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/notification:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get notifications' },
      { status: 500 }
    );
  }
}


/**
 * POST /api/notification
 * Create a new notification (for testing purposes)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get user from session
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { title, message, type, metadata } = body;

    if (!title || !message || !type) {
      return NextResponse.json(
        { success: false, message: 'Title, message, and type are required' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['UPDATE', 'SYSTEM', 'PROMOTIONAL', 'SECURITY'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, message: `Type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Process notification through service
    const result = await NotificationService.processNotification({
      title,
      message,
      type,
      recipientId: user._id.toString(),
      metadata,
    });

    return NextResponse.json({
      success: true,
      data: {
        notification: result.notification,
        channels: result.channels,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/notification:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notification
 * Delete notifications
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    // Get user from session
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { notificationIds } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'notificationIds array is required' },
        { status: 400 }
      );
    }

    await NotificationService.deleteNotifications(user._id.toString(), notificationIds);

    // Get updated unread count
    const { unreadCount } = await NotificationService.getUserNotifications(user._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        unreadCount,
        hasUnread: unreadCount > 0,
      },
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/notification:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete notifications' },
      { status: 500 }
    );
  }
} 