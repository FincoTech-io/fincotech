import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/merchants/[merchantId]/menu/categories - Get all categories
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { merchantId } = await params;
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');
    
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

    let allCategories: any[] = [];

    if (menuId) {
      // Get categories from specific menu
      const menu = merchant.restaurantMenu.menus.find((m: any) => m.id === menuId);
      if (!menu) {
        return NextResponse.json(
          { success: false, error: 'Menu not found' },
          { status: 404 }
        );
      }
      allCategories = menu.categories.map((cat: any) => ({
        ...cat,
        menuId: menu.id,
        menuName: menu.name
      }));
    } else {
      // Get categories from all menus
      merchant.restaurantMenu.menus.forEach((menu: any) => {
        menu.categories.forEach((category: any) => {
          allCategories.push({
            ...category,
            menuId: menu.id,
            menuName: menu.name
          });
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        categories: allCategories,
        total: allCategories.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

// POST /api/merchants/[merchantId]/menu/categories - Create new category
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

    const { menuId, name, description, displayOrder } = await request.json();
    
    if (!menuId || !name) {
      return NextResponse.json(
        { success: false, error: 'menuId and name are required' },
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

    // Find the menu to add category to
    const menu = merchant.restaurantMenu.menus.find((m: any) => m.id === menuId);
    if (!menu) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    // Create new category
    const newCategory = {
      id: uuidv4(),
      name,
      description: description || '',
      displayOrder: displayOrder || menu.categories.length + 1,
      isActive: true,
      isPopular: false,
      items: [],
      maxItemsPerOrder: undefined,
      requiredWithOtherCategory: undefined
    };

    // Add category to menu
    menu.categories.push(newCategory);
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    // Transform response to match frontend expectations
    const responseCategory = {
      id: newCategory.id,
      name: newCategory.name,
      description: newCategory.description,
      displayOrder: newCategory.displayOrder,
      menuId: menu.id,
      menuName: menu.name
    };

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        category: responseCategory
      },
      message: 'Category created successfully'
    });

  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create category' },
      { status: 500 }
    );
  }
} 