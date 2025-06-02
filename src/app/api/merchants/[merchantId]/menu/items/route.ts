import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import Merchant, { IMenuItem } from '@/models/Merchant';
import { getUserFromSession } from '@/utils/serverAuth';
import { v4 as uuidv4 } from 'uuid';

// GET /api/merchants/[merchantId]/menu/items - Get menu items
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    await connectToDatabase();
    
    const { merchantId } = await params;
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get('menuId');
    const categoryId = searchParams.get('categoryId');
    const isAvailable = searchParams.get('isAvailable');
    const tags = searchParams.get('tags');
    const includeSingular = searchParams.get('includeSingular') === 'true';
    
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
      // Skip menu if specific menuId requested and doesn't match
      if (menuId && menu.id !== menuId) return;

      menu.categories.forEach((category: any) => {
        // Skip category if specific categoryId requested and doesn't match
        if (categoryId && category.id !== categoryId) return;

        category.items.forEach((item: any) => {
          // Filter singular items based on includeSingular parameter
          if (item.isSingularItem && !includeSingular) return;
          if (!item.isSingularItem && includeSingular) return;

          allItems.push({
            id: item.id,
            name: item.name,
            description: item.description,
            shortDescription: item.shortDescription,
            images: item.images || [],
            basePrice: item.basePrice,
            compareAtPrice: item.compareAtPrice,
            tax: item.tax || 0,
            isOnSale: item.isOnSale,
            saleEndDate: item.saleEndDate,
            preparationTime: item.preparationTime,
            servingSize: item.servingSize,
            calories: item.calories,
            isAvailable: item.isAvailable,
            availabilitySchedule: item.availabilitySchedule,
            inventoryTracking: item.inventoryTracking,
            tags: item.tags || [],
            dietaryInfo: item.dietaryInfo,
            allergens: item.allergens || [],
            spiceLevel: item.spiceLevel,
            displayOrder: item.displayOrder,
            isPopular: item.isPopular,
            isFeatured: item.isFeatured,
            isNewItem: item.isNewItem,
            badgeText: item.badgeText,
            modifierGroups: item.modifierGroups || [],
            recommendedWith: item.recommendedWith || [],
            substitutes: item.substitutes || [],
            menuId: item.menuId || menu.id,
            categoryId: item.categoryId || category.id,
            isSingularItem: item.isSingularItem || false,
            // Include menu and category info for context
            categoryName: category.name,
            menuName: menu.name,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt
          });
        });
      });
    });

    // Apply additional filters
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

    // Sort by displayOrder and name
    allItems.sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) {
        return a.displayOrder - b.displayOrder;
      }
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        items: allItems,
        total: allItems.length,
        filters: {
          menuId: menuId || null,
          categoryId: categoryId || null,
          isAvailable: isAvailable || null,
          tags: tags || null,
          includeSingular
        }
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

// POST /api/merchants/[merchantId]/menu/items - Create new menu item
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

    const itemData = await request.json();
    const {
      menuId,
      categoryId,
      name,
      description,
      shortDescription,
      basePrice,
      compareAtPrice,
      tax,
      images = [],
      preparationTime = 15,
      servingSize,
      calories,
      tags = [],
      allergens = [],
      spiceLevel,
      dietaryInfo = {},
      modifierGroups = [],
      isSingularItem = false
    } = itemData;
    
    // Validation
    if (!name || basePrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'name and basePrice are required' },
        { status: 400 }
      );
    }

    if (!isSingularItem && (!menuId || !categoryId)) {
      return NextResponse.json(
        { success: false, error: 'menuId and categoryId are required for non-singular items' },
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

    // Create new menu item
    const newItem: any = {
      id: uuidv4(),
      name,
      description,
      shortDescription,
      images,
      basePrice,
      compareAtPrice,
      tax: tax || 0,
      isOnSale: compareAtPrice ? compareAtPrice < basePrice : false,
      preparationTime,
      servingSize,
      calories,
      isAvailable: true,
      tags,
      dietaryInfo,
      allergens,
      spiceLevel,
      displayOrder: 0,
      isPopular: false,
      isFeatured: false,
      isNewItem: true,
      modifierGroups,
      menuId: menuId || null,
      categoryId: categoryId || null,
      isSingularItem,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (isSingularItem) {
      // Add to merchant's singular items (if such structure exists)
      // For now, we'll add it to the first menu's first category as a fallback
      if (merchant.restaurantMenu.menus.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No menus available. Please create a menu first.' },
          { status: 400 }
        );
      }
      
      const firstMenu = merchant.restaurantMenu.menus[0];
      if (firstMenu.categories.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No categories available. Please create a category first.' },
          { status: 400 }
        );
      }

      const firstCategory = firstMenu.categories[0];
      newItem.displayOrder = firstCategory.items.length + 1;
      firstCategory.items.push(newItem);
    } else {
      // Find the specified menu and category
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

      newItem.displayOrder = category.items.length + 1;
      category.items.push(newItem);
    }
    
    // Increment menu version
    merchant.restaurantMenu.version = (merchant.restaurantMenu.version || 1) + 1;
    
    await merchant.save();

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        item: newItem
      },
      message: 'Menu item created successfully'
    });

  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create menu item' },
      { status: 500 }
    );
  }
} 