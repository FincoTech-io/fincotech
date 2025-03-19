import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import redisService from '@/utils/redis';

// Constants for token configuration
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json({ 
        error: 'Refresh token is required' 
      }, { status: 400 });
    }

    try {
      // Verify the refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as {
        userId: string;
        tokenId: string;
        type: string;
      };
      
      // Ensure this is a refresh token
      if (decoded.type !== 'refresh') {
        return NextResponse.json({ 
          error: 'Invalid token type' 
        }, { status: 401 });
      }
      
      // Check if refresh token exists in Redis
      const tokenKey = `${REFRESH_TOKEN_PREFIX}${decoded.tokenId}`;
      const storedUserId = await redisService.get(tokenKey);
      
      if (!storedUserId || storedUserId !== decoded.userId) {
        return NextResponse.json({ 
          error: 'Invalid or revoked refresh token' 
        }, { status: 401 });
      }
      
      // Create a new access token
      const newAccessToken = jwt.sign(
        {
          userId: decoded.userId,
          type: 'access',
          // Get other claims from the original token that you need
        },
        process.env.JWT_SECRET as string,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );
      
      return NextResponse.json({
        success: true,
        token: newAccessToken
      });
      
    } catch (error) {
      console.error('Refresh token error:', error);
      return NextResponse.json({ 
        error: 'Invalid refresh token' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 