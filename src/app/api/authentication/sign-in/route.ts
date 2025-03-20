import { User } from '@/models/User';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import redisService from '@/utils/redis';
import Wallet from '@/models/Wallet';
// Constants for token configuration
const ACCESS_TOKEN_EXPIRY = '15m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d'; // Long-lived refresh token
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

export async function POST(request: Request) {
  const { phoneNumber, pin } = await request.json();

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

  user.lastLogin = new Date();  
  await user.save();

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
  
  // Store refresh token information in Redis
  try {
    // Convert days to seconds for Redis expiry (7 Days)
    const expiryInSeconds = 60 * 60 * 24 * 7;
    await redisService.setWithExpiry(
      `${REFRESH_TOKEN_PREFIX}${refreshTokenId}`,
      user._id.toString(),
      expiryInSeconds
    );
  } catch (error) {
    console.error('Error storing refresh token:', error);
    // Continue even if Redis fails
  }

  const wallet = await Wallet.findOne({ userId: user._id }); 

  // Mobile app version: return tokens in response body
  return NextResponse.json({ 
    success: true,
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: {
      id: user._id.toString(),
      phoneNumber: user.phoneNumber,
      role: user.role,
      profileImage: user.profileImage,
      fullName: user.fullName,
      email: user.email,
      isActive: user.isActive,
      wallet: {
        balance: wallet?.balance,
        address: wallet?.address,
      }
    }
  });
}


