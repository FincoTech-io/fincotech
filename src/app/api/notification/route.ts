import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { NotificationService } from '../../../utils/notificationService';
import { getUserFromSession } from '../../../utils/serverAuth';
import { jwtVerify } from 'jose';
import { getAccessToken, verifyAccessToken } from '@/utils/serverAuth';

/**
 * GET /api/notification
 * Get notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Get token
    const token = getAccessToken(request);

    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    // Verify the token
    const payload = await verifyAccessToken(token);

    // Extract userId from token payload
    const userId = payload?.userId as string;

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
    await connectToDatabase();

    // Get user from session
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { notificationId, deleteAll } = body;

    if (deleteAll) {
      await NotificationService.deleteAllNotifications(user);
    } else if (notificationId) {
      await NotificationService.deleteNotification(user, notificationId);
    }

    return NextResponse.json({
      success: true,
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
    await connectToDatabase();

    // Get user from session
    const user = await getUserFromSession(req);

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await req.json();
    const { notificationId, deleteAll } = body;
    
    // If deleteAll is true, delete all notifications
    if (deleteAll) {
      await NotificationService.deleteAllNotifications(user);
    } else if (notificationId) {
      // Delete a specific notification
      await NotificationService.deleteNotification(user, notificationId);
    } else {
      return NextResponse.json(
        { success: false, message: 'Either notificationId or deleteAll is required' },
        { status: 400 }
      );
    }

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