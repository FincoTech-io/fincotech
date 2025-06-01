import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import User from '@/models/User';
import { getAccessToken, verifyAccessToken } from '@/utils/serverAuth';

/**
 * GET /api/user/applications
 * 
 * Retrieves the applications of the authenticated user
 * Authentication token required in Authorization header or as a cookie
 * 
 * @returns User's applications data
 */
export async function GET(request: NextRequest) {
  try {
    // Get token
    const token = getAccessToken(request);

    // If no token, return unauthorized
    if (!token) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'No authentication token provided'
      }, { status: 401 });
    }

    try {
      // Verify the token
      const payload = await verifyAccessToken(token);
      
      // Extract userId from token payload
      const userId = payload?.userId as string;

      // Connect to database
      await connectToDatabase();

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

    } catch (error) {
      console.error('Error verifying token:', error);
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error('Error retrieving user applications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve user applications' },
      { status: 500 }
    );
  }
} 