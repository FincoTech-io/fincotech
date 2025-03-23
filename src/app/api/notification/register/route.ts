import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '../../../../utils/notificationService';
import { getUserFromSession } from '../../../../utils/serverAuth';
import { connectToDatabase } from '@/utils/db';
import { User } from '@/models/User';
import { jwtVerify } from 'jose';

/**
 * POST /api/notification/register
 * Register a device for push notifications
 */

export async function POST(req: NextRequest) {
  try {
    // Connect to database
    await connectToDatabase();

    // Get token from Authorization header (for mobile apps)
    const authHeader =  req.headers.get('Authorization');
    let token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;
    
    // Fallback to cookies (for web apps)
    if (!token) {
      token = req.cookies.get('auth_token')?.value || null;
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

    // Find user by ID
    const user = await User.findById(userId)
    .select('-pin -security')  // Exclude sensitive fields
    .lean()
    .exec();

    // If user not found
    if (!user) {
    return NextResponse.json(
        { 
        success: false,
        error: 'User not found' 
        },
        { status: 404 }
    );
    }


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
