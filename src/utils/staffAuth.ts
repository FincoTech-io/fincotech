import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectToDatabase } from '@/utils/db';
import Staff, { IStaff } from '../models/Staff';

const JWT_SECRET = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('Please define the JWT_SECRET environment variable');
}

export interface StaffTokenPayload {
  staffId: string;
  employeeNumber: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract staff token from request (cookie or Authorization header)
 */
export const getStaffToken = (request: NextRequest): string | null => {
  // Try to get token from cookie first
  const cookieToken = request.cookies.get('staff-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to Authorization header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
};

/**
 * Verify staff token and return payload
 */
export const verifyStaffToken = async (token: string): Promise<StaffTokenPayload | null> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as StaffTokenPayload;
    
    // Check token expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      console.error('Staff token has expired');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Error verifying staff token:', error);
    return null;
  }
};

/**
 * Get authenticated staff member from request
 */
export const getAuthenticatedStaff = async (request: NextRequest): Promise<{ staff: IStaff; payload: StaffTokenPayload } | null> => {
  try {
    await connectToDatabase();
    
    const token = getStaffToken(request);
    if (!token) {
      return null;
    }

    const payload = await verifyStaffToken(token);
    if (!payload) {
      return null;
    }

    const staff = await Staff.findById(payload.staffId);
    if (!staff || staff.employmentStatus !== 'Active') {
      return null;
    }

    return { staff, payload };
  } catch (error) {
    console.error('Error getting authenticated staff:', error);
    return null;
  }
};

/**
 * Check if staff member has required role
 */
export const hasRole = (staffRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(staffRole);
};

/**
 * Check if staff member has admin role
 */
export const isAdmin = (staffRole: string): boolean => {
  return staffRole === 'Admin';
};

/**
 * Authorization response for API routes
 */
export const unauthorizedResponse = (message = 'Unauthorized') => {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
};

/**
 * Forbidden response for API routes
 */
export const forbiddenResponse = (message = 'Insufficient permissions') => {
  return new Response(JSON.stringify({
    success: false,
    error: message
  }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
}; 