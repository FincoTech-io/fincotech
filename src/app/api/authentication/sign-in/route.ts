import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import redisService from '@/utils/redis';
import Wallet from '@/models/Wallet';
import { Expo } from 'expo-server-sdk';
import { connectToDatabase } from '@/utils/db';

// Constants for token configuration
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d'; // Long-lived refresh token
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

// Extend the API timeout limit to 60 seconds
export const runtime = 'nodejs';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const maxDuration = 60; // Sets the timeout to 60 seconds

export async function POST(request: Request) {
  try {
    // Connect to the database first before performing any MongoDB operations
    await connectToDatabase();
    
    const { phoneNumber, pin, pushToken } = await request.json();

    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPinValid = await bcrypt.compare(pin, user.pin);

    if (!isPinValid) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'User is not active' }, { status: 401 });
    }

    // Update last login time
    user.lastLogin = new Date();  
    
    // Handle pushToken if provided
    let pushTokenUpdated = false;
    if (pushToken) {
      // Validate the Expo push token format
      if (Expo.isExpoPushToken(pushToken)) {
        if (!user.pushToken || user.pushToken !== pushToken) {
          console.log(`Updating push token for user ${user._id}`);
          user.pushToken = pushToken;
          pushTokenUpdated = true;
        }
      } else {
        console.log(`Invalid push token format: ${pushToken}`);
      }
    }
    
    // Generate a unique refresh token ID
    const refreshTokenId = uuidv4();
    
    // Create access token (short-lived)
    const accessToken = jwt.sign(
      { 
        userId: user._id.toString(), 
        role: user.role,
        type: 'access',
      }, 
      process.env.JWT_SECRET as string,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    // Create refresh token (long-lived)
    const refreshToken = jwt.sign(
      { 
        userId: user._id.toString(),
        type: 'refresh',
        tokenId: refreshTokenId
      },
      process.env.JWT_SECRET as string,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    
    // Run the save operation, redis update, and wallet lookup in parallel
    // Convert days to seconds for Redis expiry (7 Days)
    const expiryInSeconds = 60 * 60 * 24 * 7;
    
    const [_, wallet] = await Promise.all([
      // Save user changes
      user.save(),
      
      // Find wallet
      Wallet.findOne({ userId: user._id }),
      
      // Store refresh token in Redis (we don't need to await its result specifically)
      redisService.setWithExpiry(
        `${REFRESH_TOKEN_PREFIX}${refreshTokenId}`,
        user._id.toString(),
        expiryInSeconds
      ).catch(error => {
        // Log the error but don't fail the sign-in process
        console.error('Error storing refresh token:', error);
        return null;
      })
    ]);

    // Mobile app version: return tokens in response body
    return NextResponse.json({ 
      success: true,
      accessToken: accessToken,
      refreshToken: refreshToken,
      pushTokenUpdated,
      user: {
        id: user._id.toString(),
        phoneNumber: user.phoneNumber,
        role: user.role,
        profileImage: user.profileImage,
        fullName: user.fullName,
        email: user.email,
        isActive: user.isActive,
        pushToken: user.pushToken, // Include current pushToken in response
        wallet: {
          balance: wallet?.balance,
          address: wallet?.address,
        },
        createdAt: user?.createdAt,
        updatedAt: user?.updatedAt,
      }
    });
  } catch (error) {
    console.error('Error during sign-in process:', error);
    return NextResponse.json({ error: 'An error occurred during sign-in' }, { status: 500 });
  }
}


