import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import { getAccessToken, verifyAccessToken } from '../../../../utils/serverAuth';
import { connectToDatabase } from '@/utils/db';

/**
 * POST /api/notification/register
 * Register a device for push notifications
 */

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get user from request headers
    const token = getAccessToken(req);
    console.log('🔍 Token:', token);

    // Verify token
    const user = await verifyAccessToken(token as string);
    console.log('🔍 User:', user);


    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body

    const body = await req.json();
    const { pushToken } = body;

    // Validate input
    if (!pushToken) {
      return NextResponse.json({ success: false, message: 'Push token is required' }, { status: 400 });
    }

    // Register device for push notifications
    const success = await NotificationService.registerUserDevice(pushToken, user.id);

    if (success) {
      return NextResponse.json({ success: true, message: 'Device registered successfully' }, { status: 200 });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to register device' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error registering device:', error);

    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
