import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { getUserFromSession } from '@/utils/serverAuth';
import { checkMerchantStaffAccess } from '@/utils/merchantUtils';
import { Merchant } from '@/models/Merchant';
import { ObjectId } from 'mongodb';

// Extend the timeout for this API route to handle image uploads
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    
    // Validate merchantId format
    if (!ObjectId.isValid(merchantId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // No authentication required for viewing menu - public access
    
    // Find merchant and get menu data
    const merchant = await Merchant.findById(merchantId).select('merchantName merchantAddress restaurantMenu').lean();

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Transform database format to frontend format if menu exists
    let transformedMenuData = null;
    let operatingHours = null;
    
    if (merchant.restaurantMenu) {
      transformedMenuData = transformDatabaseToFrontend(merchant.restaurantMenu, merchantId, merchant.merchantName);
      
      // Extract operating hours for top-level access
      if (merchant.restaurantMenu.operatingHours) {
        operatingHours = transformOperatingHoursToBusinessHours(merchant.restaurantMenu.operatingHours);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        merchantName: merchant.merchantName,
        merchantAddress: merchant.merchantAddress,
        operatingHours: operatingHours,
        hasMenu: !!merchant.restaurantMenu,
        menuData: transformedMenuData
      },
      message: transformedMenuData ? 'Menu data retrieved successfully' : 'No menu data found for this merchant'
    });

  } catch (error) {
    console.error('Error retrieving menu data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    const { merchantId } = await params;
    
    // Validate merchantId format
    if (!ObjectId.isValid(merchantId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid merchant ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get user from token
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const menuData = await request.json();
    console.log('Received menu data:', JSON.stringify(menuData, null, 2));

    // Validate required fields
    if (!menuData.merchantId || !menuData.merchantName) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID and name are required' },
        { status: 400 }
      );
    }

    // Verify merchantId matches params
    if (menuData.merchantId !== merchantId) {
      return NextResponse.json(
        { success: false, error: 'Merchant ID mismatch' },
        { status: 400 }
      );
    }

    // Find merchant and check access
    const merchant = await Merchant.findById(merchantId);

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Check if user has access to update this merchant's menu
    const accessResult = await checkMerchantStaffAccess(user._id.toString(), merchantId, [
      'ADMIN', 
      'MERCHANT_OWNER', 
      'MERCHANT_MANAGER'
    ]);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Insufficient permissions to update menu.' },
        { status: 403 }
      );
    }

    // Transform frontend data to database format (images should already be URLs from upload endpoint)
    console.log('🏗️ Transforming menu data for database...');
    const restaurantMenu = transformMenuData(menuData);

    console.log('💾 Updating merchant in database...');
    console.log('Database structure preview:', JSON.stringify({
      menusCount: restaurantMenu.menus?.length || 0,
      categoriesCount: restaurantMenu.categories?.length || 0,
      itemsCount: restaurantMenu.items?.length || 0,
      firstMenu: restaurantMenu.menus?.[0] || null,
      firstCategory: restaurantMenu.categories?.[0] || null,
      firstItem: restaurantMenu.items?.[0] || null
    }, null, 2));

    // Update merchant with new restaurant menu data
    const updatedMerchant = await Merchant.findByIdAndUpdate(
      merchantId,
      { 
        restaurantMenu: restaurantMenu,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedMerchant) {
      console.error('❌ Failed to update merchant - merchant not found after update');
      return NextResponse.json(
        { success: false, error: 'Failed to update merchant menu' },
        { status: 500 }
      );
    }

    console.log('✅ Merchant updated successfully');
    console.log('Updated menu structure:', {
      menusCount: updatedMerchant.restaurantMenu?.menus?.length || 0,
      categoriesCount: (updatedMerchant.restaurantMenu as any)?.categories?.length || 0,
      itemsCount: (updatedMerchant.restaurantMenu as any)?.items?.length || 0
    });

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        merchantName: menuData.merchantName,
        restaurantMenu: updatedMerchant.restaurantMenu,
        totalMenus: menuData.totalMenus || 0,
        totalCategories: menuData.totalCategories || 0,
        totalItems: menuData.totalItems || 0,
        timestamp: menuData.timestamp
      },
      message: 'Restaurant menu updated successfully'
    });

  } catch (error) {
    console.error('Error updating restaurant menu:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function transformMenuData(frontendData: any) {
  // Transform business hours
  const operatingHours = transformBusinessHours(frontendData.businessHours);
  
  // Create separate arrays for menus, categories, and items
  const menus: any[] = [];
  const categories: any[] = [];
  const items: any[] = [];
  
  // Process frontend menus
  if (frontendData.menus && Array.isArray(frontendData.menus)) {
    frontendData.menus.forEach((menu: any) => {
      menus.push({
        id: menu.id,
        name: menu.name,
        description: menu.description || '',
        timeSlots: menu.timeSlots || [],
        isActive: menu.isActive !== false,
        displayOrder: menu.displayOrder || 1
      });
    });
  }
  
  // Process frontend categories
  if (frontendData.categories && Array.isArray(frontendData.categories)) {
    frontendData.categories.forEach((categoryName: string, index: number) => {
      categories.push({
        id: `category_${Date.now()}_${index}`,
        name: categoryName,
        description: '',
        displayOrder: index + 1,
        isActive: true
      });
    });
  }
  
  // Process frontend menu items
  if (frontendData.menuItems && Array.isArray(frontendData.menuItems)) {
    console.log(`📦 Processing ${frontendData.menuItems.length} menu items...`);
    
    frontendData.menuItems.forEach((item: any, index: number) => {
      const itemId = `item_${Date.now()}_${index}`;
      
      console.log(`🔍 Processing item: ${item.name}`);
      
      // Find category ID by name
      let categoryId = null;
      if (item.categories && Array.isArray(item.categories) && item.categories.length > 0) {
        const categoryName = item.categories[0]; // Take first category
        const category = categories.find(cat => cat.name === categoryName);
        categoryId = category?.id;
        console.log(`📁 Item "${item.name}" -> Category "${categoryName}" -> ID: ${categoryId}`);
      } else if (item.categoryId) {
        // Handle case where categoryId is passed directly as a name
        const category = categories.find(cat => cat.name === item.categoryId);
        categoryId = category?.id;
        console.log(`📁 Item "${item.name}" -> Direct Category "${item.categoryId}" -> ID: ${categoryId}`);
      }
      
      // Find menu ID by name - single menu reference
      let menuId = null;
      let menuName = item.menu || item.menuId; // Support both field names
      
      if (menuName) {
        const foundMenu = menus.find(menu => menu.name === menuName);
        if (foundMenu) {
          menuId = foundMenu.id;
          console.log(`🍽️ Item "${item.name}" -> Menu "${menuName}" -> ID: ${foundMenu.id}`);
        } else {
          console.log(`⚠️ Menu not found for item "${item.name}": ${menuName}`);
        }
      }
      
      console.log(`✅ Creating item with ID: ${itemId}, CategoryID: ${categoryId}, MenuID: ${menuId}`);
      
      items.push({
        id: itemId,
        name: item.name,
        description: item.description || 'No description',
        image: item.image ? {
          url: item.image,
          publicId: item.imagePublicId || `menu_items/${Date.now()}`,
          alt: item.name,
          width: 800,
          height: 600
        } : null,
        basePrice: parseFloat(item.price || item.basePrice) || 0,
        tax: parseFloat(item.tax) || 0,
        preparationTime: item.preparationTime || 15,
        calories: item.calories || undefined,
        isAvailable: item.isAvailable !== false,
        displayOrder: item.displayOrder || (index + 1),
        modifierGroups: item.modifiers || item.modifierGroups || [],
        categoryId: categoryId,
        menuId: menuId  // Single menu reference instead of array
      });
    });
    
    console.log(`✅ Created ${items.length} items`);
  }

  console.log(`📊 Final counts: ${menus.length} menus, ${categories.length} categories, ${items.length} items`);

  // Create restaurant menu structure with flat arrays
  return {
    restaurantInfo: {
      cuisineTypes: [],
      priceRange: '$$',
      averagePreparationTime: 20,
      images: {
        gallery: []
      },
      rating: {
        average: 0,
        totalReviews: 0
      }
    },
    operatingHours,
    serviceOptions: {
      dineIn: {
        available: true,
        tableReservations: false,
        walkInsAccepted: true
      },
      takeout: {
        available: true,
        estimatedWaitTime: 15,
        orderAheadTime: 10
      },
      delivery: {
        available: false,
        radius: 0,
        minimumOrder: 0,
        deliveryFee: 0,
        estimatedDeliveryTime: 30,
        deliveryZones: []
      },
      curbside: {
        available: false,
        instructions: ''
      }
    },
    businessStatus: {
      isOpen: true,
      currentStatus: 'OPEN',
      busyLevel: 'MODERATE'
    },
    menus,
    categories,
    items,
    orderingRules: {
      minimumOrderAmount: 0,
      maximumOrderAmount: 1000,
      acceptsCash: true,
      requiresPrePayment: false
    },
    version: 1,
    isActive: true
  };
}

function transformBusinessHours(businessHours: any) {
  const dayMapping: { [key: string]: string } = {
    monday: 'MONDAY',
    tuesday: 'TUESDAY', 
    wednesday: 'WEDNESDAY',
    thursday: 'THURSDAY',
    friday: 'FRIDAY',
    saturday: 'SATURDAY',
    sunday: 'SUNDAY'
  };

  const schedule: any = {};

  Object.keys(dayMapping).forEach(day => {
    const dayData = businessHours[day];
    const dayOfWeek = dayMapping[day];
    
    if (dayData) {
      schedule[dayOfWeek] = {
        isOpen: dayData.isOpen || false,
        periods: dayData.isOpen ? [{
          openTime: convertTo24Hour(dayData.startTime),
          closeTime: convertTo24Hour(dayData.endTime),
          serviceTypes: ['DINE_IN', 'TAKEOUT']
        }] : [],
        breaks: []
      };
    } else {
      schedule[dayOfWeek] = {
        isOpen: false,
        periods: [],
        breaks: []
      };
    }
  });

  return {
    timezone: 'America/Vancouver',
    schedule,
    specialHours: [],
    temporaryClosures: []
  };
}

function convertTo24Hour(timeStr: string): string {
  if (!timeStr) return '00:00';
  
  // Handle formats like "9:00 AM", "5:00 PM"
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return timeStr; // Return as-is if format doesn't match
  
  let [, hours, minutes, period] = match;
  let hour24 = parseInt(hours, 10);
  
  if (period.toUpperCase() === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  
  return `${hour24.toString().padStart(2, '0')}:${minutes}`;
}

/**
 * Transform database restaurant menu format back to frontend format
 */
function transformDatabaseToFrontend(restaurantMenu: any, merchantId: string, merchantName: string) {
  // Extract business hours from operating hours
  const businessHours = transformOperatingHoursToBusinessHours(restaurantMenu.operatingHours);
  
  // Extract flat arrays
  const menus = restaurantMenu.menus || [];
  const categories = restaurantMenu.categories || [];
  const items = restaurantMenu.items || [];
  
  // Transform categories to simple array of names (for frontend compatibility)
  const categoryNames = categories.map((cat: any) => cat.name);
  
  // Transform items back to frontend format
  const menuItems = items.map((item: any) => {
    // Find category name by ID
    const category = categories.find((cat: any) => cat.id === item.categoryId);
    const categoryName = category ? category.name : 'Uncategorized';
    
    // Find menu name by ID
    const menu = menus.find((menu: any) => menu.id === item.menuId);
    const menuName = menu ? menu.name : '';
    
    return {
      name: item.name,
      description: item.description,
      price: item.basePrice?.toString() || '0',
      tax: item.tax?.toString() || '0',
      image: item.image?.url || null,
      imagePublicId: item.image?.publicId || null,
      categories: [categoryName],
      menu: menuName,
      modifiers: item.modifierGroups || [],
      isSingularItem: item.isSingularItem || false,
      displayOrder: item.displayOrder || 1
    };
  });
  
  return {
    merchantId,
    merchantName,
    businessHours,
    menus: menus.map((menu: any) => {
      // Count items in this menu by filtering items that reference this menu
      const menuItemCount = items.filter((item: any) => item.menuId === menu.id).length;
      
      return {
        id: menu.id,
        name: menu.name,
        description: menu.description || '',
        timeSlots: menu.timeSlots || [],
        categories: categoryNames, // All categories available to all menus
        isActive: menu.isActive,
        displayOrder: menu.displayOrder || 1,
        itemCount: menuItemCount
      };
    }),
    categories: categoryNames,
    menuItems: menuItems,
    totalMenus: menus.length,
    totalCategories: categories.length,
    totalItems: items.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Transform operating hours back to business hours format
 */
function transformOperatingHoursToBusinessHours(operatingHours: any) {
  const dayMapping: { [key: string]: string } = {
    MONDAY: 'monday',
    TUESDAY: 'tuesday',
    WEDNESDAY: 'wednesday', 
    THURSDAY: 'thursday',
    FRIDAY: 'friday',
    SATURDAY: 'saturday',
    SUNDAY: 'sunday'
  };

  const businessHours: any = {};
  
  Object.keys(dayMapping).forEach(dbDay => {
    const frontendDay = dayMapping[dbDay];
    const daySchedule = operatingHours?.schedule?.[dbDay];
    
    if (daySchedule) {
      const firstPeriod = daySchedule.periods?.[0];
      businessHours[frontendDay] = {
        isOpen: daySchedule.isOpen || false,
        startTime: firstPeriod ? convertFrom24Hour(firstPeriod.openTime) : '9:00 AM',
        endTime: firstPeriod ? convertFrom24Hour(firstPeriod.closeTime) : '5:00 PM'
      };
    } else {
      businessHours[frontendDay] = {
        isOpen: false,
        startTime: '9:00 AM',
        endTime: '5:00 PM'
      };
    }
  });
  
  return businessHours;
}

/**
 * Convert 24-hour time to 12-hour format
 */
function convertFrom24Hour(timeStr: string): string {
  if (!timeStr) return '9:00 AM';
  
  const [hours, minutes] = timeStr.split(':');
  let hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  
  return `${hour}:${minutes} ${period}`;
} 