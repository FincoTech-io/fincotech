import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { NotificationService } from '../../../../utils/notificationService';
import { getAccessToken, getUserFromSession, verifyAccessToken } from '../../../../utils/serverAuth';
import User from '../../../../models/User';
/**
 * PATCH /api/notification/read
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
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
    // Get request body
    const body = await request.json();

    const { notificationId, markAll } = body;
    
    let result: boolean | number;
    
    // If markAll is true, mark all notifications as read
    if (markAll) {
      result = await NotificationService.markAllNotificationsAsRead(userId);
    } else if (notificationId) {
      // Mark a specific notification as read
      result = await NotificationService.markNotificationAsRead(userId, notificationId);
    } else {
      return NextResponse.json(
        { success: false, message: 'Either notificationId or markAll is required' },
        { status: 400 }
      );
    }
    
    // Get updated unread count
    const { unreadCount } = await NotificationService.getUserNotifications(userId, unreadOnly);
    
    return NextResponse.json({
      success: true,
      data: {
        result,
        unreadCount,
        hasUnread: unreadCount > 0,
      },
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/notification/read:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
} 