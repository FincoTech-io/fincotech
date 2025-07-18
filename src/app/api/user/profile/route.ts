import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import User from '@/models/User';
import Wallet from '@/models/Wallet';
import { jwtVerify } from 'jose';
import { IUser } from '@/models/User';
import { getAccessToken, verifyAccessToken } from '@/utils/serverAuth';

/**
 * GET /api/user/profile
 * 
 * Retrieves the profile of the authenticated user
 * Authentication token can be provided in Authorization header or as a cookie
 * 
 * @returns User profile data (excluding sensitive information)
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
      const payload = await verifyAccessToken(token) ;
      
      // Extract userId from token payload
      const userId = payload?.userId as string;

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

      // Find the user's wallet
      const wallet = await Wallet.findOne({ userId })
        .lean()
        .exec();

      if (!wallet) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Wallet not found' 
          },
          { status: 404 }
        );
      }

      // Return user profile data with wallet information
      return NextResponse.json({
        success: true,
        user: {
          id: user._id.toString(),
          fullName: user.fullName,
          phoneNumber: user.phoneNumber,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          isActive: user.isActive,
          nationality: user.nationality,
          idType: user.idType,
          idNumber: user.idNumber,
          profileImage: user.profileImage,
          pushToken: user.pushToken,
          currentRegion: user.currentRegion,
          currentAddress: user.currentAddress,
          hasUnreadNotifications: user.hasUnreadNotifications,
          merchantAccess: user.merchantAccess || [],
          driverAccountId: user.driverAccountId,
          applications: user.applications || [],
          notifications: user.notifications || [],
          notificationPreferences: user.notificationPreferences,
          wallet: {
            balance: wallet.balance,
            currency: wallet.currency,
            tier: wallet.tier,
            address: wallet.address,
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }, { status: 200 });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Token is invalid
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Invalid authentication token' 
        },
        { status: 401 }
      );
      
      // Only clear cookie if it exists (for web apps)
      if (request.cookies.get('auth_token')) {
        response.cookies.delete('auth_token');
      }
      
      return response;
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * 
 * Updates the profile of the authenticated user
 * Authentication token can be provided in Authorization header or as a cookie
 * 
 * @returns Updated user profile data
 */
export async function PATCH(request: NextRequest) {
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
      const payload = await verifyAccessToken(token) ;
      
      // Extract userId from token payload
      const userId = payload?.userId as string;

      // Connect to database
      await connectToDatabase();

      // Parse the request body
      const updateData = await request.json();
      
      // Fields that are allowed to be updated
      const allowedFields = [
        'fullName',
        'email',
        'profileImage',
        'currentRegion',
        'pushToken',
        'notificationPreferences',
        'nationality',
        'idType',
        'idNumber',
        'currentRegion',
      ];

      // Filter out fields that are not allowed to be updated
      const filteredUpdateData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {} as Record<string, IUser>);

      // If no valid fields to update
      if (Object.keys(filteredUpdateData).length === 0) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No valid fields to update' 
          },
          { status: 400 }
        );
      }

      // Update the user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: filteredUpdateData },
        { new: true, runValidators: true }
      )
        .select('-pin -security.answer')  // Exclude sensitive fields
        .lean()
        .exec();

      // If user not found
      if (!updatedUser) {
        return NextResponse.json(
          { 
            success: false,
            error: 'User not found' 
          },
          { status: 404 }
        );
      }

      // Find the user's wallet
      const wallet = await Wallet.findOne({ userId })
        .lean()
        .exec();

      if (!wallet) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Wallet not found' 
          },
          { status: 404 }
        );
      }

      // Return updated user profile data with wallet information
      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser._id.toString(),
          fullName: updatedUser.fullName,
          phoneNumber: updatedUser.phoneNumber,
          email: updatedUser.email,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
          isActive: updatedUser.isActive,
          nationality: updatedUser.nationality,
          idType: updatedUser.idType,
          idNumber: updatedUser.idNumber,
          profileImage: updatedUser.profileImage,
          pushToken: updatedUser.pushToken,
          currentRegion: updatedUser.currentRegion,
          currentAddress: updatedUser.currentAddress,
          hasUnreadNotifications: updatedUser.hasUnreadNotifications,
          merchantAccess: updatedUser.merchantAccess || [],
          driverAccountId: updatedUser.driverAccountId,
          applications: updatedUser.applications || [],
          notifications: updatedUser.notifications || [],
          notificationPreferences: updatedUser.notificationPreferences,
          wallet: {
            balance: wallet.balance,
            currency: wallet.currency,
            tier: wallet.tier,
            address: wallet.address
          },
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt
        }
      }, { status: 200 });
    } catch (error) {
      console.error('Error updating user profile:', error);
      // Token is invalid
      const response = NextResponse.json(
        { 
          success: false,
          error: 'Invalid authentication token' 
        },
        { status: 401 }
      );
      
      // Only clear cookie if it exists (for web apps)
      if (request.cookies.get('auth_token')) {
        response.cookies.delete('auth_token');
      }
      
      return response;
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
