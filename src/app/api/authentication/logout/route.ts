import { NextRequest, NextResponse } from 'next/server';
import { blacklistToken } from '@/utils/authServerHelper';
import jwt from 'jsonwebtoken';
import redisService from '@/utils/redis';
import { getAccessToken } from '@/utils/serverAuth';
const REFRESH_TOKEN_PREFIX = 'refresh_token:';

export async function POST(request: NextRequest) {
  try {
    // Get tokens from request body
    const body = await request.json();
    const refreshToken = body.refreshToken;
    
    const accessToken = getAccessToken(request);
    
    // If we have a refresh token, delete it from Redis
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as {
          tokenId: string;
          type: string;
        };
        
        if (decoded.type === 'refresh' && decoded.tokenId) {
          // Delete the refresh token from Redis
          await redisService.del(`${REFRESH_TOKEN_PREFIX}${decoded.tokenId}`);
        }
      } catch (error) {
        console.error('Error decoding refresh token during logout:', error);
        // Continue even if token verification fails
      }
    }
    
    // If we have an access token, blacklist it
    if (accessToken) {
      await blacklistToken(accessToken, 'user_logout');
    }
    
    // Create response
    const response = NextResponse.json({ 
      success: true,
      message: 'Logged out successfully'
    });
    
    // Clear cookie for web apps
    if (request.cookies.get('auth_token')) {
      response.cookies.delete('auth_token');
    }
    
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ 
      success: true, // Still indicate success to client
      message: 'Logged out successfully'
    });
  }
} 