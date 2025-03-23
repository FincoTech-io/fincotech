import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { connectDB } from './database';
import { User, IUser } from '../models/User';
import { isTokenBlacklisted } from './authServerHelper';
import { cache } from 'react';

// Secret key for JWT verification
const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

// Error types for more specific error handling
export enum AuthError {
  NO_TOKEN = 'No token provided',
  INVALID_TOKEN = 'Invalid token',
  BLACKLISTED_TOKEN = 'Token is blacklisted',
  USER_NOT_FOUND = 'User not found',
  DATABASE_ERROR = 'Database connection error',
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
      console.error(AuthError.BLACKLISTED_TOKEN);
      return null;
    }

    // Verify token
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    
    // Additional check for token expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      console.error('Token has expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

// Cache user lookup for performance
const getUserById = cache(async (userId: string): Promise<IUser | null> => {
  try {
    return await User.findById(userId);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
});

// Initialize database connection once
let isDbConnected = false;
const ensureDbConnection = async () => {
  if (!isDbConnected) {
    await connectDB();
    isDbConnected = true;
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
      console.error(AuthError.NO_TOKEN);
      return null;
    }

    // Verify token
    const payload = await verifyAccessToken(token);
    if (!payload || !payload.sub) {
      console.error(AuthError.INVALID_TOKEN);
      return null;
    }

    // Connect to database if not already connected
    await ensureDbConnection();

    // Get user from database with caching
    const user = await getUserById(payload.sub as string);
    
    if (!user) {
      console.error(AuthError.USER_NOT_FOUND);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting user from session:', error);
    return null;
  }
}; 