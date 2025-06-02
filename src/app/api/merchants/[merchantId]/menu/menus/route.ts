import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/merchants/[merchantId]/menu/menus - Get all menus
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { merchantId } = await params;
    
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

    // Transform menus to include timeSlots from availability
    const menusWithTimeSlots = merchant.restaurantMenu.menus.map((menu: any) => ({
      id: menu.id,
      name: menu.name,
      description: menu.description,
      timeSlots: Object.entries(menu.availability?.timeRestrictions || {}).map(([day, periods]: [string, any]) => ({
        startTime: periods[0]?.openTime || '00:00',
        endTime: periods[0]?.closeTime || '23:59',
        daysOfWeek: [day]
      })),
      categories: menu.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        displayOrder: cat.displayOrder
      })),
      isActive: menu.isActive,
      displayOrder: menu.displayOrder
    }));

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        menus: menusWithTimeSlots
      }
    });

  } catch (error: any) {
    console.error('Error fetching menus:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch menus' },
      { status: 500 }
    );
  }
}

// POST /api/merchants/[merchantId]/menu/menus - Create new menu
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
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
    
    const { merchantId } = await params;
    
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

    const { name, description, timeSlots, isActive = true, displayOrder } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Menu name is required' },
        { status: 400 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT') {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Initialize restaurant menu if it doesn't exist
    if (!merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant menu not initialized. Please create restaurant menu first.' },
        { status: 400 }
      );
    }

    // Convert timeSlots to availability format
    const availability = {
      timeRestrictions: {
        MONDAY: [],
        TUESDAY: [],
        WEDNESDAY: [],
        THURSDAY: [],
        FRIDAY: [],
        SATURDAY: [],
        SUNDAY: []
      } as any,
      dateRestrictions: {}
    };

    if (timeSlots && Array.isArray(timeSlots)) {
      timeSlots.forEach((slot: any) => {
        slot.daysOfWeek?.forEach((day: string) => {
          const dayKey = day.toUpperCase();
          if (availability.timeRestrictions[dayKey as keyof typeof availability.timeRestrictions]) {
            (availability.timeRestrictions as any)[dayKey] = [{
              openTime: slot.startTime,
              closeTime: slot.endTime,
              serviceTypes: ['DINE_IN', 'TAKEOUT', 'DELIVERY']
            }];
          }
        });
      });
    }

    // Create new menu
    const newMenu = {
      id: uuidv4(),
      name,
      description: description || '',
      availability,
      displayOrder: displayOrder || merchant.restaurantMenu.menus.length + 1,
      isActive,
      categories: []
    };

    // Add menu to restaurant
    merchant.restaurantMenu.menus.push(newMenu);
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    // Transform response to match frontend expectations
    const responseMenu = {
      id: newMenu.id,
      name: newMenu.name,
      description: newMenu.description,
      timeSlots: timeSlots || [],
      categories: [],
      isActive: newMenu.isActive,
      displayOrder: newMenu.displayOrder
    };

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        menu: responseMenu
      },
      message: 'Menu created successfully'
    });

  } catch (error: any) {
    console.error('Error creating menu:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create menu' },
      { status: 500 }
    );
  }
} 