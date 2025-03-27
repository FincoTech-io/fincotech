import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { NotificationService } from '../../../utils/notificationService';
import { getUserFromSession } from '../../../utils/serverAuth';
import { jwtVerify } from 'jose';
import { getAccessToken, verifyAccessToken } from '@/utils/serverAuth';

/**
 * POST /api/notification
 * Get notifications for the authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Get token
    const token = getAccessToken(request);
    const {unreadOnly} = await request.json();

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
      userId,
      unreadOnly
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
 * DELETE /api/notification
 * Delete notifications
 */
export async function DELETE(req: NextRequest) {
  try {
    // Get token
    const token = getAccessToken(req);

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

    // Get request body
    const body = await req.json();
    const { notificationId, deleteAll } = body;

    let result: boolean | number;
    
    // If deleteAll is true, delete all notifications
    if (deleteAll) {
      await NotificationService.deleteAllNotifications(userId);
    } else if (notificationId) {
      // Delete a specific notification
      await NotificationService.deleteNotification(userId, notificationId);
    } else {
      return NextResponse.json(
        { success: false, message: 'Either notificatio._id.toString()nId or deleteAll is required' },
        { status: 400 }
      );
    }

    // Get updated unread count
    const { unreadCount } = await NotificationService.getUserNotifications(userId);

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