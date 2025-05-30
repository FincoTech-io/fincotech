import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
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
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Build query
    let query: any = {};
    
    if (search) {
      query.$or = [
        { merchantName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      query.verificationStatus = status.toUpperCase();
    }
    
    if (type && type !== 'all') {
      query.merchantType = type;
    }

    const merchants = await Merchant.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v') // Exclude version field
      .lean();

    const total = await Merchant.countDocuments(query);

    return NextResponse.json({
      success: true,
      data: {
        merchants,
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
    console.error('Error fetching merchants:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch merchants' },
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
    const { merchantId, verificationStatus, notes } = await request.json();
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    const validStatuses = ['PENDING', 'VERIFIED', 'REJECTED'];
    if (verificationStatus && !validStatuses.includes(verificationStatus)) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification status' },
        { status: 400 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Update merchant status
    if (verificationStatus) {
      merchant.verificationStatus = verificationStatus;
    }
    
    // Add staff note to notifications if provided
    if (notes) {
      merchant.notifications.push({
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
      merchant.hasUnreadNotifications = true;
    }

    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId: merchant._id,
        verificationStatus: merchant.verificationStatus,
        updatedBy: {
          staffId: staff._id,
          name: `${staff.firstName} ${staff.lastName}`,
          employeeNumber: staff.employeeNumber
        }
      },
      message: 'Merchant updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating merchant:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update merchant' },
      { status: 500 }
    );
  }
} 