import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../utils/database';
import { getUserFromSession } from '../../../../utils/serverAuth';
import User from '../../../../models/User';
import { Expo } from 'expo-server-sdk';

/**
 * POST /api/user/push-token
 * Update the user's push token for receiving notifications
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
    const { pushToken } = body;
    
    if (!pushToken) {
      return NextResponse.json(
        { success: false, message: 'Push token is required' },
        { status: 400 }
      );
    }

    // Validate Expo push token format
    if (!Expo.isExpoPushToken(pushToken)) {
      return NextResponse.json(
        { success: false, message: 'Invalid Expo push token format' },
        { status: 400 }
      );
    }
    
    // Update the user's push token
    await User.findByIdAndUpdate(user._id, { pushToken });
    
    return NextResponse.json({
      success: true,
      message: 'Push token updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating push token:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update push token' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/push-token
 * Remove the user's push token (unregister from push notifications)
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    // Get user from session
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Remove the push token by setting it to null
    await User.findByIdAndUpdate(user._id, { pushToken: null });
    
    return NextResponse.json({
      success: true,
      message: 'Push token removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing push token:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to remove push token' },
      { status: 500 }
    );
  }
} 