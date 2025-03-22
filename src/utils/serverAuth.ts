import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from './database';
import { User, IUser } from '../models/User';
import { isTokenBlacklisted } from './authServerHelper';

// Secret key for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

/**
 * Get the access token from the request headers or cookies
 */
export const getAccessToken = (req: NextRequest): string | null => {
  // Check authorization header first
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // If no auth header, try cookies
  const cookies = req.cookies;
  return cookies.get('accessToken')?.value || null;
};

/**
 * Verify the access token and return the payload
 */
export const verifyAccessToken = async (token: string) => {
  try {
    // Check if token is blacklisted
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return null;
    }

    // Verify token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Get the user from the request session
 */
export const getUserFromSession = async (req: NextRequest): Promise<IUser | null> => {
  try {
    // Get access token
    const token = getAccessToken(req);
    if (!token) {
      return null;
    }

    // Verify token
    const payload = await verifyAccessToken(token);
    if (!payload || !payload.sub) {
      return null;
    }

    // Connect to database
    await connectDB();

    // Get user from database
    const user = await User.findById(payload.sub);
    return user;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}; 