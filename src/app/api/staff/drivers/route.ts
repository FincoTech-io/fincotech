import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Application from '@/models/Application';
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

    // Build query for driver applications
    let query: any = {
      applicationType: 'driver',
      driverApplication: { $exists: true }
    };
    
    if (search) {
      query.$or = [
        { 'driverApplication.accountHolderName': { $regex: search, $options: 'i' } },
        { 'driverApplication.licenseNumber': { $regex: search, $options: 'i' } },
        { 'driverApplication.vehiclePlate': { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query['driverApplication.verificationStatus'] = status;
    }
    
    if (service && service !== 'all') {
      query[`driverApplication.serviceTypes.${service}`] = true;
    }

    const applications = await Application.find(query)
      .sort({ submissionDate: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id applicationRef driverApplication applicantUserId submissionDate createdAt updatedAt')
      .lean();

    const total = await Application.countDocuments(query);

    // Transform applications to driver format
    const drivers = applications.map(app => ({
      _id: app._id,
      applicationRef: app.applicationRef,
      applicantUserId: app.applicantUserId,
      createdAt: app.createdAt || app.submissionDate,
      updatedAt: app.updatedAt || app.submissionDate,
      ...app.driverApplication
    }));

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

    const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
    if (verificationStatus && !validStatuses.includes(verificationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification status' },
        { status: 400 }
      );
    }

    const application = await Application.findById(driverId);
    
    if (!application || application.applicationType !== 'driver' || !application.driverApplication) {
      return NextResponse.json(
        { success: false, error: 'Driver application not found' },
        { status: 404 }
      );
    }

    // Update driver verification status
    if (verificationStatus) {
      application.driverApplication.verificationStatus = verificationStatus;
      
      // Also update the main application status based on verification status
      const statusMapping: { [key: string]: 'Pending' | 'In Review' | 'Approved' | 'Declined' } = {
        'pending': 'Pending',
        'under_review': 'In Review', 
        'approved': 'Approved',
        'rejected': 'Declined'
      };
      application.status = (statusMapping[verificationStatus] || 'Pending') as 'Pending' | 'In Review' | 'Approved' | 'Declined';
      
      if (verificationStatus === 'approved') {
        application.approvalDate = new Date();
      } else if (verificationStatus === 'rejected') {
        application.rejectionDate = new Date();
      }
      
      application.reviewDate = new Date();
      application.reviewedBy = staff._id as any;
    }
    
    // Add staff note to driver notifications if provided
    if (notes) {
      if (!application.driverApplication.notifications) {
        application.driverApplication.notifications = [];
      }
      
      application.driverApplication.notifications.push({
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
      application.driverApplication.hasUnreadNotifications = true;
    }

    if (notes) {
      application.reviewNotes = notes;
    }

    await application.save();

    return NextResponse.json({
      success: true,
      data: {
        driverId: application._id,
        verificationStatus: application.driverApplication.verificationStatus,
        applicationStatus: application.status,
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