import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Staff, { IStaff } from '@/models/Staff';

// GET - List all staff or get specific staff by ID
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const employeeNumber = searchParams.get('employeeNumber');
    const email = searchParams.get('email');
    const team = searchParams.get('team');
    const role = searchParams.get('role');
    const employmentStatus = searchParams.get('employmentStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query: any = {};

    // Build query based on parameters
    if (employeeNumber) {
      query.employeeNumber = employeeNumber;
    }
    if (email) {
      query.email = email.toLowerCase();
    }
    if (team) {
      query.team = { $regex: team, $options: 'i' };
    }
    if (role) {
      query.role = role;
    }
    if (employmentStatus) {
      query.employmentStatus = employmentStatus;
    }

    // If searching for specific staff member
    if (employeeNumber || email) {
      const staff = await Staff.findOne(query).populate('reportsTo', 'firstName lastName employeeNumber');
      
      if (!staff) {
        return NextResponse.json({
          success: false,
          message: 'Staff member not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: staff
      });
    }

    // List all staff with pagination
    const skip = (page - 1) * limit;
    const staff = await Staff.find(query)
      .populate('reportsTo', 'firstName lastName employeeNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalStaff = await Staff.countDocuments(query);
    const totalPages = Math.ceil(totalStaff / limit);

    return NextResponse.json({
      success: true,
      data: staff,
      pagination: {
        page,
        limit,
        totalStaff,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST - Create new staff member
export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      password,
      employmentStatus = 'Active',
      phoneNumber,
      jobTitle,
      reportsTo,
      address,
      role = 'Staff',
      taxId,
      email,
      team,
      hireDate,
      countryCode = 'ZWE' // Default to Zimbabwe
    } = body;

    // Validate required fields
    const requiredFields = [
      'firstName', 'lastName', 'dateOfBirth', 'password', 
      'phoneNumber', 'jobTitle', 'address', 'taxId', 'email', 'team'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({
          success: false,
          message: `${field} is required`
        }, { status: 400 });
      }
    }

    // Check if email or phone already exists
    const existingStaff = await Staff.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phoneNumber },
        { taxId }
      ]
    });

    if (existingStaff) {
      return NextResponse.json({
        success: false,
        message: 'Staff member with this email, phone number, or tax ID already exists'
      }, { status: 400 });
    }

    // Generate employee number
    const employeeNumber = await (Staff as any).generateEmployeeNumber(countryCode);

    // Validate reportsTo if provided
    if (reportsTo) {
      const supervisor = await Staff.findById(reportsTo);
      if (!supervisor) {
        return NextResponse.json({
          success: false,
          message: 'Invalid supervisor ID'
        }, { status: 400 });
      }
    }

    // Create new staff member
    const newStaff = new Staff({
      firstName,
      middleName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      employeeNumber,
      password,
      employmentStatus,
      phoneNumber,
      jobTitle,
      reportsTo: reportsTo || undefined,
      address,
      role,
      taxId,
      email: email.toLowerCase(),
      team,
      hireDate: hireDate ? new Date(hireDate) : new Date()
    });

    const savedStaff = await newStaff.save();

    // Populate reportsTo for response
    await savedStaff.populate('reportsTo', 'firstName lastName employeeNumber');

    return NextResponse.json({
      success: true,
      message: 'Staff member created successfully',
      data: savedStaff
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating staff:', error);
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({
        success: false,
        message: 'Staff member with this information already exists'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// PATCH - Update staff member
export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const employeeNumber = searchParams.get('employeeNumber');
    const email = searchParams.get('email');

    if (!employeeNumber && !email) {
      return NextResponse.json({
        success: false,
        message: 'Employee number or email is required'
      }, { status: 400 });
    }

    const body = await request.json();
    const updateData = { ...body };

    // Remove fields that shouldn't be updated directly
    delete updateData.employeeNumber;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // If password is being updated, it will be hashed by the pre-save hook
    if (updateData.email) {
      updateData.email = updateData.email.toLowerCase();
    }

    if (updateData.dateOfBirth) {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    if (updateData.hireDate) {
      updateData.hireDate = new Date(updateData.hireDate);
    }

    // Validate reportsTo if provided
    if (updateData.reportsTo) {
      const supervisor = await Staff.findById(updateData.reportsTo);
      if (!supervisor) {
        return NextResponse.json({
          success: false,
          message: 'Invalid supervisor ID'
        }, { status: 400 });
      }
    }

    let query: any = {};
    if (employeeNumber) {
      query.employeeNumber = employeeNumber;
    } else {
      query.email = email!.toLowerCase();
    }

    const updatedStaff = await Staff.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    ).populate('reportsTo', 'firstName lastName employeeNumber');

    if (!updatedStaff) {
      return NextResponse.json({
        success: false,
        message: 'Staff member not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff
    });

  } catch (error) {
    console.error('Error updating staff:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// DELETE - Soft delete (set employment status to Terminated)
export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const employeeNumber = searchParams.get('employeeNumber');
    const email = searchParams.get('email');

    if (!employeeNumber && !email) {
      return NextResponse.json({
        success: false,
        message: 'Employee number or email is required'
      }, { status: 400 });
    }

    let query: any = {};
    if (employeeNumber) {
      query.employeeNumber = employeeNumber;
    } else {
      query.email = email!.toLowerCase();
    }

    const staff = await Staff.findOneAndUpdate(
      query,
      { employmentStatus: 'Terminated' },
      { new: true }
    );

    if (!staff) {
      return NextResponse.json({
        success: false,
        message: 'Staff member not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member terminated successfully',
      data: staff
    });

  } catch (error) {
    console.error('Error deleting staff:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 