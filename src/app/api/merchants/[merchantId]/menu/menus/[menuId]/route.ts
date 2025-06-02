import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';

// PUT /api/merchants/[merchantId]/menu/menus/[menuId] - Update menu
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; menuId: string }> }
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
    
    const { merchantId, menuId } = await params;
    
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

    const { name, description, timeSlots, isActive, displayOrder } = await request.json();
    
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT' || !merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or menu not found' },
        { status: 404 }
      );
    }

    // Find the menu to update
    const menuIndex = merchant.restaurantMenu.menus.findIndex((m: any) => m.id === menuId);
    if (menuIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    const menu = merchant.restaurantMenu.menus[menuIndex];

    // Update menu fields
    if (name !== undefined) menu.name = name;
    if (description !== undefined) menu.description = description;
    if (isActive !== undefined) menu.isActive = isActive;
    if (displayOrder !== undefined) menu.displayOrder = displayOrder;

    // Update timeSlots if provided
    if (timeSlots) {
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

      menu.availability = availability;
    }
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    // Transform response to match frontend expectations
    const responseMenu = {
      id: menu.id,
      name: menu.name,
      description: menu.description,
      timeSlots: timeSlots || Object.entries(menu.availability?.timeRestrictions || {}).map(([day, periods]: [string, any]) => ({
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
    };

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        menu: responseMenu
      },
      message: 'Menu updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating menu:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update menu' },
      { status: 500 }
    );
  }
}

// DELETE /api/merchants/[merchantId]/menu/menus/[menuId] - Delete menu
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; menuId: string }> }
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
    
    const { merchantId, menuId } = await params;
    
    // Check user access - only ADMIN and MERCHANT_OWNER can delete menus
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && 
      ['ADMIN', 'MERCHANT_OWNER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only merchant owners and admins can delete menus.' },
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

    // Find the menu to delete
    const menuIndex = merchant.restaurantMenu.menus.findIndex((m: any) => m.id === menuId);
    if (menuIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    const deletedMenu = merchant.restaurantMenu.menus[menuIndex];

    // Remove the menu
    merchant.restaurantMenu.menus.splice(menuIndex, 1);
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        deletedMenu: {
          id: deletedMenu.id,
          name: deletedMenu.name
        }
      },
      message: 'Menu deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting menu:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete menu' },
      { status: 500 }
    );
  }
} 