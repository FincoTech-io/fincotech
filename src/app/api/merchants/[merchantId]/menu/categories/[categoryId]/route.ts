import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';

// PUT /api/merchants/[merchantId]/menu/categories/[categoryId] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; categoryId: string }> }
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
    
    const { merchantId, categoryId } = await params;
    
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

    const { name, description, displayOrder, isActive } = await request.json();
    
    const merchant = await Merchant.findById(merchantId);
    
    if (!merchant || merchant.merchantType !== 'RESTAURANT' || !merchant.restaurantMenu) {
      return NextResponse.json(
        { success: false, error: 'Restaurant or menu not found' },
        { status: 404 }
      );
    }

    // Find the category to update
    let foundCategory = null;
    let foundMenu = null;

    for (const menu of merchant.restaurantMenu.menus) {
      const category = menu.categories.find((c: any) => c.id === categoryId);
      if (category) {
        foundCategory = category;
        foundMenu = menu;
        break;
      }
    }

    if (!foundCategory || !foundMenu) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update category fields
    if (name !== undefined) foundCategory.name = name;
    if (description !== undefined) foundCategory.description = description;
    if (displayOrder !== undefined) foundCategory.displayOrder = displayOrder;
    if (isActive !== undefined) foundCategory.isActive = isActive;
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    // Transform response to match frontend expectations
    const responseCategory = {
      id: foundCategory.id,
      name: foundCategory.name,
      description: foundCategory.description,
      displayOrder: foundCategory.displayOrder,
      menuId: foundMenu.id,
      menuName: foundMenu.name
    };

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        category: responseCategory
      },
      message: 'Category updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update category' },
      { status: 500 }
    );
  }
}

// DELETE /api/merchants/[merchantId]/menu/categories/[categoryId] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; categoryId: string }> }
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
    
    const { merchantId, categoryId } = await params;
    
    // Check user access - only ADMIN and MERCHANT_OWNER can delete categories
    const hasAccess = user.merchantAccess?.some(
      (access: any) => access.merchantId === merchantId && 
      ['ADMIN', 'MERCHANT_OWNER'].includes(access.userRole)
    );
    
    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Only merchant owners and admins can delete categories.' },
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

    // Find and delete the category
    let deletedCategory = null;
    let foundMenuId = null;

    for (const menu of merchant.restaurantMenu.menus) {
      const categoryIndex = menu.categories.findIndex((c: any) => c.id === categoryId);
      if (categoryIndex !== -1) {
        deletedCategory = menu.categories[categoryIndex];
        foundMenuId = menu.id;
        
        // Check if category has items
        if (deletedCategory.items && deletedCategory.items.length > 0) {
          return NextResponse.json(
            { success: false, error: 'Cannot delete category that contains menu items. Please delete or move all items first.' },
            { status: 400 }
          );
        }

        // Remove the category
        menu.categories.splice(categoryIndex, 1);
        break;
      }
    }

    if (!deletedCategory) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
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
        deletedCategory: {
          id: deletedCategory.id,
          name: deletedCategory.name,
          menuId: foundMenuId
        }
      },
      message: 'Category deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete category' },
      { status: 500 }
    );
  }
} 