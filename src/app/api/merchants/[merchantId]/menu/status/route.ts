import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant, { IBusinessStatus } from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';

// GET /api/merchants/[merchantId]/menu/status - Get restaurant business status
export async function GET(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    await connectToDatabase();
    
    const { merchantId } = params;
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    const merchant = await Merchant.findById(merchantId).select('merchantType restaurantMenu').lean();
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT' || !merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or menu not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        businessStatus: merchant.restaurantMenu.businessStatus,
        operatingHours: merchant.restaurantMenu.operatingHours
      }
    });

  } catch (error: any) {
    console.error('Error fetching restaurant status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch restaurant status' },
      { status: 500 }
    );
  }
}

// PUT /api/merchants/[merchantId]/menu/status - Update restaurant business status
export async function PUT(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { merchantId } = params;
    
    // Check user access
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && 
      ['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const statusUpdates = await request.json();
    
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT' || !merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or menu not found' },
        { status: 404 }
      );
    }

    // Update business status
    if (statusUpdates.isOpen !== undefined) {
      merchant.restaurantMenu.businessStatus.isOpen = statusUpdates.isOpen;
    }
    
    if (statusUpdates.currentStatus) {
      merchant.restaurantMenu.businessStatus.currentStatus = statusUpdates.currentStatus;
    }
    
    if (statusUpdates.statusMessage !== undefined) {
      merchant.restaurantMenu.businessStatus.statusMessage = statusUpdates.statusMessage;
    }
    
    if (statusUpdates.estimatedReopenTime !== undefined) {
      merchant.restaurantMenu.businessStatus.estimatedReopenTime = statusUpdates.estimatedReopenTime;
    }
    
    if (statusUpdates.pausedServices) {
      merchant.restaurantMenu.businessStatus.pausedServices = statusUpdates.pausedServices;
    }
    
    if (statusUpdates.busyLevel) {
      merchant.restaurantMenu.businessStatus.busyLevel = statusUpdates.busyLevel;
    }

    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        businessStatus: merchant.restaurantMenu.businessStatus
      },
      message: 'Restaurant status updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating restaurant status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update restaurant status' },
      { status: 500 }
    );
  }
}

// POST /api/merchants/[merchantId]/menu/status/toggle - Quick toggle open/close
export async function POST(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    await connectToDatabase();
    
    // Authenticate user
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const { merchantId } = params;
    
    // Check user access
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && 
      ['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT' || !merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or menu not found' },
        { status: 404 }
      );
    }

    // Toggle open/close status
    const currentStatus = merchant.restaurantMenu.businessStatus.isOpen;
    merchant.restaurantMenu.businessStatus.isOpen = !currentStatus;
    merchant.restaurantMenu.businessStatus.currentStatus = !currentStatus ? 'OPEN' : 'CLOSED';
    
    // Clear estimated reopen time if opening
    if (!currentStatus) {
      merchant.restaurantMenu.businessStatus.estimatedReopenTime = undefined;
    }

    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        businessStatus: merchant.restaurantMenu.businessStatus,
        action: !currentStatus ? 'opened' : 'closed'
      },
      message: `Restaurant ${!currentStatus ? 'opened' : 'closed'} successfully`
    });

  } catch (error: any) {
    console.error('Error toggling restaurant status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to toggle restaurant status' },
      { status: 500 }
    );
  }
} 