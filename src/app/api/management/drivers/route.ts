import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Driver from '@/models/Driver';
import { getAuthenticatedStaff, unauthorizedResponse } from '@/utils/staffAuth';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Authenticate staff member
    const authResult = await getAuthenticatedStaff(request);
    if (!authResult) {
      return unauthorizedResponse('Staff authentication required');
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const service = searchParams.get('service');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query for drivers - by default only show verified/active drivers
    let query: any = {};
    
    // Only show verified drivers unless explicitly requesting all statuses
    if (!status || status === 'verified') {
      query.verificationStatus = 'VERIFIED';
      query.isActive = true;
    } else if (status !== 'all') {
      // Map frontend status values to database values
      const statusMapping: { [key: string]: string } = {
        'approved': 'VERIFIED',
        'pending': 'PENDING',
        'suspended': 'SUSPENDED',
        'deactivated': 'DEACTIVATED'
      };
      query.verificationStatus = statusMapping[status] || status.toUpperCase();
    }
    
    if (search) {
      query.$or = [
        { accountHolderName: { $regex: search, $options: 'i' } },
        { licenseNumber: { $regex: search, $options: 'i' } },
        { vehiclePlate: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (service && service !== 'all') {
      query[`serviceTypes.${service}`] = true;
    }

    const drivers = await Driver.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v') // Exclude version field
      .lean();

    const total = await Driver.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        drivers,
        pagination: {
          total,
          limit,
          skip,
          hasMore: skip + limit < total,
          currentPage: Math.floor(skip / limit) + 1,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching drivers:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch drivers' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await connectToDatabase();
    
    // Authenticate staff member
    const authResult = await getAuthenticatedStaff(request);
    if (!authResult) {
      return unauthorizedResponse('Staff authentication required');
    }
    
    const { staff } = authResult;
    const { driverId, verificationStatus, notes } = await request.json();
    
    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'Driver ID is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['VERIFIED', 'PENDING', 'SUSPENDED', 'DEACTIVATED'];
    if (verificationStatus && !validStatuses.includes(verificationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification status' },
        { status: 400 }
      );
    }

    const driver = await Driver.findById(driverId);
    
    if (!driver) {
      return NextResponse.json(
        { success: false, error: 'Driver not found' },
        { status: 404 }
      );
    }

    // Update driver verification status
    if (verificationStatus) {
      driver.verificationStatus = verificationStatus;
      
      // Update active status based on verification status
      if (verificationStatus === 'VERIFIED') {
        driver.isActive = true;
      } else if (verificationStatus === 'SUSPENDED' || verificationStatus === 'DEACTIVATED') {
        driver.isActive = false;
      }
    }
    
    // Add staff note to driver notifications if provided
    if (notes) {
      if (!driver.notifications) {
        driver.notifications = [];
      }
      
      driver.notifications.push({
        title: 'Status Update',
        message: notes,
        type: 'SYSTEM',
        isRead: false,
        pinned: false,
        creationTime: new Date(),
        metadata: {
          updatedBy: staff._id,
          staffName: `${staff.firstName} ${staff.lastName}`,
          statusChange: verificationStatus
        }
      });
      driver.hasUnreadNotifications = true;
    }

    await driver.save();

    return NextResponse.json({
      success: true,
      data: {
        driverId: driver._id,
        verificationStatus: driver.verificationStatus,
        isActive: driver.isActive,
        updatedBy: {
          staffId: staff._id,
          name: `${staff.firstName} ${staff.lastName}`,
          employeeNumber: staff.employeeNumber
        }
      },
      message: 'Driver updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating driver:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update driver' },
      { status: 500 }
    );
  }
} 