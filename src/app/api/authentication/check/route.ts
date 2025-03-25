import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { User } from '@/models/User';
import { getAccessToken } from '@/utils/serverAuth';

export async function GET(request: NextRequest) {
  const token = getAccessToken(request);
  
  if (!token) {
    return NextResponse.json({ 
      authenticated: false,
      message: 'No authentication token provided'
    }, { status: 401 });
  }

  try {
    // Verify the token
    const secretKey = new TextEncoder().encode(
      process.env.JWT_SECRET as string
    );
    
    const { payload } = await jwtVerify(token, secretKey);
    
    // Get user data from database (optional - only if you need fresh data)
    const user = await User.findById(payload.userId);
    
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