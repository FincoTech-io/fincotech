import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';

// DELETE /api/merchants/[merchantId]/menu/items/[itemId]/images/[imageId] - Delete image from menu item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; itemId: string; imageId: string }> }
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
    
    const { merchantId, itemId, imageId } = await params;
    
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

    if (!foundItem.images || foundItem.images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No images found for this menu item' },
        { status: 404 }
      );
    }

    // Find the image to delete (by publicId)
    const imageIndex = foundItem.images.findIndex((img: any) => img.publicId === imageId);
    
    if (imageIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    const deletedImage = foundItem.images[imageIndex];

    // Remove the image
    foundItem.images.splice(imageIndex, 1);
    
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
        deletedImage: {
          publicId: deletedImage.publicId,
          url: deletedImage.url,
          alt: deletedImage.alt
        },
        remainingImages: foundItem.images.length
      },
      message: 'Image deleted from menu item successfully'
    });

  } catch (error: any) {
    console.error('Error deleting image from menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete image from menu item' },
      { status: 500 }
    );
  }
} 