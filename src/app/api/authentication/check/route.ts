import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { User } from '@/models/User';
import { getAccessToken, verifyAccessToken } from '@/utils/serverAuth';
import { connectToDatabase } from '@/utils/db';

// Extend the API timeout limit
export const runtime = 'nodejs';
export const maxDuration = 30; // Sets the timeout to 30 seconds

export async function GET(request: NextRequest) {
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
    // Connect to the database before performing MongoDB operations
    await connectToDatabase();
    
    // Verify the token
    const payload = await verifyAccessToken(token) ;
    
    // Get user data from database (optional - only if you need fresh data)
    const user = await User.findById(payload?.userId as string);
    
    if (!user) {
      return NextResponse.json({ 
        authenticated: false,
        message: 'User not found'
      }, { status: 401 });
    }
    
    // Return authenticated status and user data
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error checking authentication:', error);
    
    // Token is invalid
    const response = NextResponse.json({ 
      authenticated: false,
      message: 'Invalid token',
      error: error
    }, { status: 401 });
    
    // Only clear cookie if it exists (for web apps)
    if (request.cookies.get('auth_token')) {
      response.cookies.delete('auth_token');
    }
    
    return response;
  }
} 