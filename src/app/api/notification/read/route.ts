import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../utils/database';
import { NotificationService } from '../../../../utils/notificationService';
import { getUserFromSession } from '../../../../utils/serverAuth';

/**
 * PATCH /api/notification/read
 * Mark notifications as read
 */
export async function PATCH(req: NextRequest) {
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
    
    // If notificationIds is not provided, mark all notifications as read
    await NotificationService.markNotificationsAsRead(user._id.toString(), notificationIds);
    
    // Get updated unread count
    const { unreadCount } = await NotificationService.getUserNotifications(user._id.toString(), { limit: 1 });
    
    return NextResponse.json({
      success: true,
      data: {
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