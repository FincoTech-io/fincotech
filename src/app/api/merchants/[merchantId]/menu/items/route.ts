import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant, { IMenuItem } from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/merchants/[merchantId]/menu/items - Get all menu items
export async function GET(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    await connectToDatabase();
    
    const { merchantId } = params;
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const isAvailable = searchParams.get('isAvailable');
    const tags = searchParams.get('tags');
    
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

    // Extract all items from all categories
    let allItems: any[] = [];
    merchant.restaurantMenu.menus.forEach((menu: any) => {
      menu.categories.forEach((category: any) => {
        category.items.forEach((item: any) => {
          allItems.push({
            ...item,
            categoryId: category.id,
            categoryName: category.name,
            menuId: menu.id,
            menuName: menu.name
          });
        });
      });
    });

    // Apply filters
    if (categoryId) {
      allItems = allItems.filter(item => item.categoryId === categoryId);
    }
    
    if (isAvailable !== null) {
      const availabilityFilter = isAvailable === 'true';
      allItems = allItems.filter(item => item.isAvailable === availabilityFilter);
    }
    
    if (tags) {
      const tagArray = tags.split(',');
      allItems = allItems.filter(item => 
        tagArray.some((tag: string) => item.tags.includes(tag))
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        items: allItems,
        total: allItems.length
      }
    });

  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch menu items' },
      { status: 500 }
    );
  }
}

// POST /api/merchants/[merchantId]/menu/items - Add new menu item
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

    const { menuId, categoryId, item } = await request.json();
    
    if (!menuId || !categoryId || !item) {
      return NextResponse.json(
        { success: false, error: 'menuId, categoryId, and item data are required' },
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

    // Find the menu and category
    const menu = merchant.restaurantMenu.menus.find((m: any) => m.id === menuId);
    if (!menu) {
      return NextResponse.json(
        { success: false, error: 'Menu not found' },
        { status: 404 }
      );
    }

    const category = menu.categories.find((c: any) => c.id === categoryId);
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Create new item with required fields
    const newItem: IMenuItem = {
      id: uuidv4(),
      name: item.name,
      description: item.description,
      shortDescription: item.shortDescription || '',
      images: item.images || [],
      basePrice: item.basePrice,
      compareAtPrice: item.compareAtPrice,
      isOnSale: item.isOnSale || false,
      saleEndDate: item.saleEndDate,
      preparationTime: item.preparationTime || 15,
      servingSize: item.servingSize,
      calories: item.calories,
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      availabilitySchedule: item.availabilitySchedule,
      inventoryTracking: item.inventoryTracking,
      tags: item.tags || [],
      dietaryInfo: item.dietaryInfo || {
        isVegetarian: false,
        isVegan: false,
        isGlutenFree: false,
        isKeto: false,
        isDairyFree: false,
        isNutFree: false,
        isHalal: false,
        isKosher: false
      },
      allergens: item.allergens || [],
      spiceLevel: item.spiceLevel,
      displayOrder: item.displayOrder || category.items.length + 1,
      isPopular: item.isPopular || false,
      isFeatured: item.isFeatured || false,
      isNew: item.isNew || false,
      badgeText: item.badgeText,
      modifierGroups: item.modifierGroups || [],
      recommendedWith: item.recommendedWith || [],
      substitutes: item.substitutes || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add item to category
    category.items.push(newItem);
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        menuId,
        categoryId,
        item: newItem
      },
      message: 'Menu item added successfully'
    });

  } catch (error: any) {
    console.error('Error adding menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add menu item' },
      { status: 500 }
    );
  }
} 