import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';

// POST /api/merchants/[merchantId]/menu/items/[itemId]/images - Add image to menu item
export async function POST(
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

    const { url, publicId, alt, width, height } = await request.json();
    
    if (!url || !publicId) {
      return NextResponse.json(
        { success: false, error: 'url and publicId are required' },
        { status: 400 }
      );
    }

    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT' || !merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or menu not found' },
        { status: 404 }
      );
    }

    // Find the menu item
    let foundItem = null;
    let foundMenu = null;
    let foundCategory = null;

    for (const menu of merchant.restaurantMenu.menus) {
      for (const category of menu.categories) {
        const item = category.items.find((i: any) => i.id === itemId);
        if (item) {
          foundItem = item;
          foundMenu = menu;
          foundCategory = category;
          break;
        }
      }
      if (foundItem) break;
    }

    if (!foundItem) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      );
    }

    // Create new image object
    const newImage = {
      url,
      publicId,
      alt: alt || `${foundItem.name} image`,
      width: width || undefined,
      height: height || undefined
    };

    // Add image to item
    if (!foundItem.images) {
      foundItem.images = [];
    }
    foundItem.images.push(newImage);
    
    // Update item's updatedAt timestamp
    foundItem.updatedAt = new Date();
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        itemId,
        image: newImage,
        totalImages: foundItem.images.length
      },
      message: 'Image added to menu item successfully'
    });

  } catch (error: any) {
    console.error('Error adding image to menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add image to menu item' },
      { status: 500 }
    );
  }
} 