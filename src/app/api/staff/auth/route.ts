import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Staff from '@/models/Staff';
import jwt from 'jsonwebtoken';

// POST - Staff Login
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { employeeId, password } = body;

    // Validate required fields
    if (!employeeId || !password) {
      return NextResponse.json({
        success: false,
        message: 'Employee ID and password are required'
      }, { status: 400 });
    }

    // Find staff member by employee number
    const staff = await Staff.findOne({ 
      employeeNumber: employeeId.toUpperCase(),
      employmentStatus: 'Active' // Only allow active staff to login
    }).populate('reportsTo', 'firstName lastName employeeNumber jobTitle');

    if (!staff) {
      return NextResponse.json({
        success: false,
        message: 'Invalid employee ID or password'
      }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await staff.comparePassword(password);
    
    if (!isPasswordValid) {
      return NextResponse.json({
        success: false,
        message: 'Invalid employee ID or password'
      }, { status: 401 });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        staffId: staff._id,
        employeeNumber: staff.employeeNumber,
        role: staff.role,
        email: staff.email
      },
      process.env.JWT_SECRET || 'your-fallback-secret',
      { expiresIn: '8h' } // 8 hour session
    );

    // Update last login
    staff.set({ lastLogin: new Date() });
    await staff.save();

    // Prepare response data (password excluded by toJSON transform)
    const staffData = {
      _id: staff._id,
      employeeNumber: staff.employeeNumber,
      firstName: staff.firstName,
      middleName: staff.middleName,
      lastName: staff.lastName,
      email: staff.email,
      role: staff.role,
      jobTitle: staff.jobTitle,
      team: staff.team,
      employmentStatus: staff.employmentStatus,
      reportsTo: staff.reportsTo
    };

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      data: {
        staff: staffData,
        token
      }
    });

    // Set HTTP-only cookie for additional security
    response.cookies.set('staff-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 hours in milliseconds
    });

    return response;

  } catch (error) {
    console.error('Error during staff login:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Staff Logout
export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

    // Clear the authentication cookie
    response.cookies.delete('staff-token');

    return response;

  } catch (error) {
    console.error('Error during staff logout:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 