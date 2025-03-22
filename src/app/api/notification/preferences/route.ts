import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../utils/database';
import { getUserFromSession } from '../../../../utils/serverAuth';
import User from '../../../../models/User';

/**
 * GET /api/notification/preferences
 * Get notification preferences for the authenticated user
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get user from session
    const user = await getUserFromSession(req);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        preferences: user.notificationPreferences,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/notification/preferences:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notification/preferences
 * Update notification preferences for the authenticated user
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
    const { preferences } = body;
    
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Preferences object is required' },
        { status: 400 }
      );
    }
    
    // Validate the structure of preferences
    const validPreferenceCategories = [
      'paymentReceived', 
      'paymentSent', 
      'systemUpdates', 
      'security', 
      'promotions'
    ];
    
    const validChannels = ['sms', 'push', 'email'];
    
    // Create a sanitized preferences object
    const sanitizedPreferences: any = {};
    
    // Process each category in the preferences
    for (const category of validPreferenceCategories) {
      if (preferences[category] && typeof preferences[category] === 'object') {
        sanitizedPreferences[category] = {};
        
        // Process each channel in the category
        for (const channel of validChannels) {
          if (typeof preferences[category][channel] === 'boolean') {
            sanitizedPreferences[category][channel] = preferences[category][channel];
          }
        }
      }
    }
    
    // Create the update object for the database
    const updateObj: Record<string, any> = {};
    
    // Only add fields that were provided in the request
    for (const category in sanitizedPreferences) {
      for (const channel in sanitizedPreferences[category]) {
        updateObj[`notificationPreferences.${category}.${channel}`] = 
          sanitizedPreferences[category][channel];
      }
    }
    
    // Update user preferences in database
    if (Object.keys(updateObj).length > 0) {
      await User.findByIdAndUpdate(user._id, { $set: updateObj });
    }
    
    // Get updated user
    const updatedUser = await User.findById(user._id);
    
    return NextResponse.json({
      success: true,
      data: {
        preferences: updatedUser?.notificationPreferences,
      },
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/notification/preferences:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
} 