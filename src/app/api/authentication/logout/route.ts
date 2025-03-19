import { NextRequest, NextResponse } from 'next/server';
import { blacklistToken } from '@/utils/authServerHelper';

export async function POST(request: NextRequest) {
  // Get token from Authorization header (for mobile apps)
  const authHeader = request.headers.get('Authorization');
  let token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;
  
  // Fallback to cookies (for web apps)
  if (!token) {
    token = request.cookies.get('auth_token')?.value || null;
  }

  // If we have a token, blacklist it
  if (token) {
    await blacklistToken(token, 'user_logout');
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
} 