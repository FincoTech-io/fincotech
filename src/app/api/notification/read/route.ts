import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { NotificationService } from '../../../../utils/notificationService';
import { getUserFromSession } from '../../../../utils/serverAuth';

/**
 * PATCH /api/notification/read
 * Mark notifications as read
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Get user from session
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await req.json();
    const { notificationId, markAll } = body;
    
    let result: boolean | number;
    
    // If markAll is true, mark all notifications as read
    if (markAll) {
      result = await NotificationService.markAllNotificationsAsRead(user._id.toString());
    } else if (notificationId) {
      // Mark a specific notification as read
      result = await NotificationService.markNotificationAsRead(user._id.toString(), notificationId);
    } else {
      return NextResponse.json(
        { success: false, message: 'Either notificationId or markAll is required' },
        { status: 400 }
      );
    }
    
    // Get updated unread count
    const { unreadCount } = await NotificationService.getUserNotifications(user._id.toString());
    
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