import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    await connectToDatabase();
    
    const { userId } = params;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's applications
    const user = await User.findById(userId)
      .select('applications fullName phoneNumber')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        userInfo: {
          fullName: user.fullName,
          phoneNumber: user.phoneNumber
        },
        applications: user.applications || [],
        totalApplications: user.applications?.length || 0
      }
    });

  } catch (error: any) {
    console.error('Error retrieving user applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve user applications' },
      { status: 500 }
    );
  }
} 