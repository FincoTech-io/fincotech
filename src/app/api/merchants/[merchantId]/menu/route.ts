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

    // Get user from token
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user has access to view this merchant's menu
    const accessResult = await checkMerchantStaffAccess(user._id.toString(), merchantId, [
      'ADMIN', 
      'MERCHANT_OWNER', 
      'MERCHANT_MANAGER',
      'MERCHANT_STAFF' // Read access for all staff roles
    ]);

    if (!accessResult.hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied. You do not have permission to view this merchant menu.' },
        { status: 403 }
      );
    }

    // Find merchant and get menu data
    const merchant = await Merchant.findById(merchantId).select('merchantName restaurantMenu').lean();

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant not found' },
        { status: 404 }
      );
    }

    // Transform database format to frontend format if menu exists
    let transformedMenuData = null;
    if (merchant.restaurantMenu) {
      transformedMenuData = transformDatabaseToFrontend(merchant.restaurantMenu, merchantId, merchant.merchantName);
    }

    return NextResponse.json({
      success: true,
      data: {
        merchantId,
        merchantName: merchant.merchantName,
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
      return NextResponse.json(
        { success: false, error: 'Failed to update merchant menu' },
        { status: 500 }
      );
    }

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
  
  // Transform menus
  const menus = frontendData.menus?.map((menu: any) => ({
    id: menu.id,
    name: menu.name,
    description: menu.description || '',
    timeSlots: menu.timeSlots || [],
    categories: transformCategories(frontendData.categories, frontendData.menuItems, menu.id),
    isActive: menu.isActive !== false,
    displayOrder: menu.displayOrder || 1
  })) || [];

  // Create restaurant menu structure
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

function transformCategories(categories: string[], menuItems: any[], menuId?: string) {
  return categories.map((categoryName, index) => ({
    id: `category_${Date.now()}_${index}`,
    name: categoryName,
    description: '',
    displayOrder: index + 1,
    isActive: true,
    isPopular: false,
    items: transformMenuItems(menuItems.filter(item => 
      item.categories?.includes(categoryName) || 
      (item.isSingularItem && !menuId)
    ))
  }));
}

function transformMenuItems(items: any[]) {
  return items.map((item, index) => ({
    id: `item_${Date.now()}_${index}`,
    name: item.name,
    description: item.description || 'No description',
    shortDescription: item.description || 'No description',
    images: item.image ? [{
      url: item.image,
      publicId: item.imagePublicId || `menu_items/${Date.now()}`,
      alt: item.name,
      width: 800,
      height: 600
    }] : [],
    basePrice: parseFloat(item.price) || 0,
    compareAtPrice: undefined,
    tax: parseFloat(item.tax) || 0,
    isOnSale: false,
    preparationTime: 15,
    servingSize: '1 serving',
    calories: undefined,
    isAvailable: true,
    tags: determineTags(item),
    dietaryInfo: {
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      isKeto: false,
      isDairyFree: false,
      isNutFree: false,
      isHalal: false,
      isKosher: false
    },
    allergens: [],
    spiceLevel: undefined,
    displayOrder: index + 1,
    isPopular: false,
    isFeatured: false,
    isNewItem: false,
    badgeText: undefined,
    modifierGroups: item.modifiers || [],
    recommendedWith: [],
    substitutes: [],
    menuId: item.menu || undefined,
    categoryId: item.categories?.[0] || undefined,
    isSingularItem: item.isSingularItem || false,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
}

function determineTags(item: any): string[] {
  const tags: string[] = [];
  
  // You can add logic here to determine tags based on item properties
  // For now, return empty array
  
  return tags;
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
  
  // Extract menus
  const menus = restaurantMenu.menus || [];
  
  // Extract all categories from all menus
  const allCategories: string[] = [];
  const allMenuItems: any[] = [];
  
  menus.forEach((menu: any) => {
    if (menu.categories) {
      menu.categories.forEach((category: any) => {
        // Add category name if not already present
        if (!allCategories.includes(category.name)) {
          allCategories.push(category.name);
        }
        
        // Add items from this category
        if (category.items) {
          category.items.forEach((item: any) => {
            allMenuItems.push({
              name: item.name,
              description: item.description,
              price: item.basePrice?.toString() || '0',
              tax: item.tax?.toString() || '0',
              image: item.images?.[0]?.url || null,
              imagePublicId: item.images?.[0]?.publicId || null,
              categories: [category.name],
              menu: menu.name,
              modifiers: item.modifierGroups || [],
              isSingularItem: item.isSingularItem || false
            });
          });
        }
      });
    }
  });
  
  return {
    merchantId,
    merchantName,
    businessHours,
    menus: menus.map((menu: any) => ({
      id: menu.id,
      name: menu.name,
      description: menu.description || '',
      timeSlots: menu.timeSlots || [],
      categories: menu.categories?.map((cat: any) => cat.name) || [],
      isActive: menu.isActive,
      displayOrder: menu.displayOrder || 1,
      itemCount: menu.categories?.reduce((total: number, cat: any) => total + (cat.items?.length || 0), 0) || 0
    })),
    categories: allCategories,
    menuItems: allMenuItems,
    totalMenus: menus.length,
    totalCategories: allCategories.length,
    totalItems: allMenuItems.length,
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