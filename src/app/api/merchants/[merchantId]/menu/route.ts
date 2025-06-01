import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant, { IRestaurantMenu } from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';

// GET /api/merchants/[merchantId]/menu - Get restaurant menu
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
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.merchantType !== 'RESTAURANT') {
      return NextResponse.json(
        { success: false, error: 'This merchant is not a restaurant' },
        { status: 400 }
      );
    }

    if (!merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant menu not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        menu: merchant.restaurantMenu
      }
    });

  } catch (error: any) {
    console.error('Error fetching restaurant menu:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch restaurant menu' },
      { status: 500 }
    );
  }
}

// POST /api/merchants/[merchantId]/menu - Create restaurant menu
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
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this merchant
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && ['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to manage this merchant.' },
        { status: 403 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.merchantType !== 'RESTAURANT') {
      return NextResponse.json(
        { success: false, error: 'This merchant is not a restaurant' },
        { status: 400 }
      );
    }

    if (merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant menu already exists. Use PUT to update.' },
        { status: 400 }
      );
    }

    const menuData: IRestaurantMenu = await request.json();
    
    // Validate required fields
    if (!menuData.restaurantInfo || !menuData.operatingHours || !menuData.serviceOptions) {
      return NextResponse.json(
        { success: false, error: 'Missing required menu data: restaurantInfo, operatingHours, and serviceOptions are required' },
        { status: 400 }
      );
    }

    // Set defaults if not provided
    menuData.version = 1;
    menuData.isActive = true;
    menuData.menus = menuData.menus || [];
    
    // Set default business status if not provided
    if (!menuData.businessStatus) {
      menuData.businessStatus = {
        isOpen: false,
        currentStatus: 'CLOSED',
        pausedServices: [],
        busyLevel: 'LOW'
      };
    }

    // Set default ordering rules if not provided
    if (!menuData.orderingRules) {
      menuData.orderingRules = {
        minimumOrder: { amount: 0, serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY'] },
        advanceOrderTime: { minimum: 15, maximum: 1440 }, // 15 minutes to 24 hours
        paymentMethods: ['CREDIT_CARD', 'DEBIT_CARD'],
        tips: { allowTips: true, suggestedPercentages: [15, 18, 20] },
        cancellationPolicy: {
          allowCancellation: true,
          timeLimit: 30,
          refundPolicy: "Full refund if cancelled 30+ minutes before pickup/delivery"
        }
      };
    }

    merchant.restaurantMenu = menuData;
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        menu: merchant.restaurantMenu
      },
      message: 'Restaurant menu created successfully'
    });

  } catch (error: any) {
    console.error('Error creating restaurant menu:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create restaurant menu' },
      { status: 500 }
    );
  }
}

// PUT /api/merchants/[merchantId]/menu - Update restaurant menu
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
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this merchant
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && ['ADMIN', 'MERCHANT_OWNER', 'MERCHANT_MANAGER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to manage this merchant.' },
        { status: 403 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.merchantType !== 'RESTAURANT') {
      return NextResponse.json(
        { success: false, error: 'This merchant is not a restaurant' },
        { status: 400 }
      );
    }

    if (!merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant menu not found. Use POST to create.' },
        { status: 404 }
      );
    }

    const menuData: Partial<IRestaurantMenu> = await request.json();
    
    // Increment version number
    menuData.version = (merchant.restaurantMenu.version || 1) + 1;
    
    // Merge the updates with existing menu data
    merchant.restaurantMenu = {
      ...merchant.restaurantMenu,
      ...menuData,
      version: menuData.version
    };

    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        menu: merchant.restaurantMenu
      },
      message: 'Restaurant menu updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating restaurant menu:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update restaurant menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/merchants/[merchantId]/menu - Delete restaurant menu
export async function DELETE(
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
    
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID is required' },
        { status: 400 }
      );
    }

    // Check if user has access to this merchant with ADMIN or MERCHANT_OWNER role (only these can delete)
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && ['ADMIN', 'MERCHANT_OWNER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only ADMIN or MERCHANT_OWNER can delete restaurant menu.' },
        { status: 403 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    if (merchant.merchantType !== 'RESTAURANT') {
      return NextResponse.json(
        { success: false, error: 'This merchant is not a restaurant' },
        { status: 400 }
      );
    }

    if (!merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant menu not found' },
        { status: 404 }
      );
    }

    // Remove the restaurant menu
    merchant.restaurantMenu = undefined;
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: { merchantId },
      message: 'Restaurant menu deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting restaurant menu:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete restaurant menu' },
      { status: 500 }
    );
  }
} 