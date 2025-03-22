import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import { getUserFromSession } from '../../../../utils/serverAuth';
import { connectDB } from '../../../../utils/database';

/**
 * POST /api/notification/push
 * Send a push notification directly to a device
 * 
 * Request body:
 * {
 *   pushToken: string;  // Expo push token
 *   title: string;      // Notification title
 *   body: string;       // Notification body
 *   data?: object;      // Optional additional data
 * }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Verify the request is from an authenticated user with appropriate permissions
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow users with admin role to send direct push notifications
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Permission denied' }, { status: 403 });
    }
    
    // Parse request body
    const body = await req.json();
    const { pushToken, title, body: messageBody, data } = body;
    
    // Validate input
    if (!pushToken || typeof pushToken !== 'string') {
      return NextResponse.json({ success: false, message: 'Push token is required' }, { status: 400 });
    }
    
    if (!title || typeof title !== 'string') {
      return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
    }
    
    if (!messageBody || typeof messageBody !== 'string') {
      return NextResponse.json({ success: false, message: 'Message body is required' }, { status: 400 });
    }
    
    // Send push notification
    const success = await NotificationService.sendPushNotification(
      pushToken, 
      title, 
      messageBody, 
      data || {}
    );
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Push notification sent successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to send push notification'
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    return NextResponse.json({
      success: false,
      message: error.message || 'Internal server error'
    }, { status: 500 });
  }
} 