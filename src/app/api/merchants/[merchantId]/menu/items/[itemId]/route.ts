import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant, { IMenuItem } from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';

// GET /api/merchants/[merchantId]/menu/items/[itemId] - Get specific menu item
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; itemId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { merchantId, itemId } = await params;
    
    if (!merchantId || !itemId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID and Item ID are required' },
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

    // Find the item in any menu/category
    let foundItem: any = null;
    let itemContext: any = null;
    
    merchant.restaurantMenu.menus.forEach((menu: any) => {
      menu.categories.forEach((category: any) => {
        const item = category.items.find((item: any) => item.id === itemId);
        if (item) {
          foundItem = item;
          itemContext = {
            menuId: menu.id,
            menuName: menu.name,
            categoryId: category.id,
            categoryName: category.name
          };
        }
      });
    });

    if (!foundItem) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        item: foundItem,
        context: itemContext
      }
    });

  } catch (error: any) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch menu item' },
      { status: 500 }
    );
  }
}

// PUT /api/merchants/[merchantId]/menu/items/[itemId] - Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; itemId: string }> }
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
    
    const { merchantId, itemId } = await params;
    
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

    const updates = await request.json();
    
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT' || !merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or menu not found' },
        { status: 404 }
      );
    }

    // Find and update the item
    let itemFound = false;
    let updatedItem: any = null;
    
    merchant.restaurantMenu.menus.forEach((menu: any) => {
      menu.categories.forEach((category: any) => {
        const itemIndex = category.items.findIndex((item: any) => item.id === itemId);
        if (itemIndex !== -1) {
          // Update the item
          category.items[itemIndex] = {
            ...category.items[itemIndex],
            ...updates,
            id: itemId, // Ensure ID doesn't change
            updatedAt: new Date()
          };
          updatedItem = category.items[itemIndex];
          itemFound = true;
        }
      });
    });

    if (!itemFound) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        item: updatedItem
      },
      message: 'Menu item updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

// DELETE /api/merchants/[merchantId]/menu/items/[itemId] - Delete menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; itemId: string }> }
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
    
    const { merchantId, itemId } = await params;
    
    // Check user access (only ADMIN and MERCHANT_OWNER can delete items)
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && 
      ['ADMIN', 'MERCHANT_OWNER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only ADMIN or MERCHANT_OWNER can delete menu items.' },
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

    // Find and delete the item
    let itemFound = false;
    let deletedItem: any = null;
    
    merchant.restaurantMenu.menus.forEach((menu: any) => {
      menu.categories.forEach((category: any) => {
        const itemIndex = category.items.findIndex((item: any) => item.id === itemId);
        if (itemIndex !== -1) {
          deletedItem = category.items[itemIndex];
          category.items.splice(itemIndex, 1);
          itemFound = true;
        }
      });
    });

    if (!itemFound) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        deletedItem: { id: deletedItem.id, name: deletedItem.name }
      },
      message: 'Menu item deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete menu item' },
      { status: 500 }
    );
  }
} 