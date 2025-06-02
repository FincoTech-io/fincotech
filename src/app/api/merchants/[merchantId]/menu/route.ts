import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/utils/db';
import { getUserFromSession } from '@/utils/serverAuth';
import { checkMerchantStaffAccess } from '@/utils/merchantUtils';
import { Merchant } from '@/models/Merchant';
import { uploadImageToCloudinary } from '@/utils/applicationUtils';
import { ObjectId } from 'mongodb';

// Extend the timeout for this API route to handle image uploads
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

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

    // Process menu items with image uploads
    console.log('🖼️ Processing menu items with image uploads...');
    const processedMenuItems = await processMenuItemImages(menuData.menuItems || [], merchantId);
    const updatedMenuData = { ...menuData, menuItems: processedMenuItems };

    // Transform frontend data to database format
    const restaurantMenu = transformMenuData(updatedMenuData);

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

/**
 * Process menu item images and upload to Cloudinary
 * 
 * Supported image formats:
 * - Base64 data URLs (data:image/jpeg;base64,...)
 * - Raw base64 strings (long strings > 1000 chars)
 * - Existing HTTP/HTTPS URLs (will be preserved)
 * - File URLs (file://) - should be converted to base64 by frontend
 * 
 * Folder structure: fincotech/Merchant/[merchantId]/[itemId]
 */
async function processMenuItemImages(menuItems: any[], merchantId: string): Promise<any[]> {
  const processedItems = [];
  const totalItems = menuItems.length;
  const itemsWithImages = menuItems.filter(item => item.image && typeof item.image === 'string').length;
  
  console.log(`🖼️ Processing ${totalItems} menu items, ${itemsWithImages} have images`);
  
  // Process items sequentially to avoid timeout issues
  for (let i = 0; i < menuItems.length; i++) {
    const item = menuItems[i];
    let processedItem = { ...item };
    
    if (item.image && typeof item.image === 'string') {
      try {
        // Generate unique item ID for folder structure
        const itemId = `item_${Date.now()}_${i}`;
        const cloudinaryFolder = `fincotech/Merchant/${merchantId}/${itemId}`;
        
        // Check if it's a local file path (from mobile app) or base64 data
        if (item.image.startsWith('file://') || item.image.startsWith('data:image/') || item.image.length > 1000) {
          console.log(`📤 [${i + 1}/${totalItems}] Uploading image for: ${item.name}`);
          
          let imageToUpload = item.image;
          
          // If it's a file:// URL, we'll need to handle it as base64 (should be handled by frontend)
          if (item.image.startsWith('file://')) {
            console.log('⚠️ File URL detected - this should be converted to base64 by frontend');
            // For now, skip the upload and remove the image
            processedItem.image = null;
            processedItems.push(processedItem);
            continue;
          }
          
          // Upload to Cloudinary with extended timeout
          const uploadResult = await uploadImageToCloudinaryWithTimeout(
            imageToUpload,
            cloudinaryFolder,
            `${item.name.replace(/[^a-zA-Z0-9]/g, '_')}_image`,
            60000 // 60 second timeout
          );
          
          // Update item with Cloudinary URL and metadata
          processedItem.image = uploadResult.url;
          processedItem.imagePublicId = uploadResult.publicId;
          processedItem.imageUploadedAt = uploadResult.uploadedAt;
          
          console.log(`✅ [${i + 1}/${totalItems}] Successfully uploaded: ${item.name}`);
        } else {
          // If it's already a URL (http/https), keep it as is
          console.log(`🔗 [${i + 1}/${totalItems}] Using existing URL for: ${item.name}`);
        }
      } catch (error) {
        console.error(`❌ [${i + 1}/${totalItems}] Error uploading image for ${item.name}:`, error);
        // Remove image reference if upload fails
        processedItem.image = null;
      }
    } else {
      console.log(`⏭️ [${i + 1}/${totalItems}] No image for: ${item.name}`);
    }
    
    processedItems.push(processedItem);
  }
  
  console.log(`🎉 Completed processing all ${totalItems} menu items`);
  return processedItems;
}

/**
 * Upload image to Cloudinary with custom timeout
 */
async function uploadImageToCloudinaryWithTimeout(
  base64Image: string,
  folder: string,
  originalName: string,
  timeoutMs: number = 60000
): Promise<{ url: string; publicId: string; uploadedAt: Date }> {
  const { v2: cloudinary } = await import('cloudinary');
  
  // Configure Cloudinary if not already configured
  if (!cloudinary.config().cloud_name) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  return new Promise((resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error(`Cloudinary upload timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    // Remove the data:image/xxx;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Data}`, {
      folder: folder,
      resource_type: 'image',
      public_id: `${Date.now()}_${originalName}`,
      transformation: [
        { width: 800, height: 600, crop: 'limit' }, // Smaller size for faster upload
        { quality: 'auto:low' },
        { format: 'jpg' }
      ],
      timeout: timeoutMs
    })
    .then((result) => {
      clearTimeout(timeoutId);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        uploadedAt: new Date()
      });
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      console.error('Cloudinary upload error:', error);
      reject(new Error(`Failed to upload image to Cloudinary: ${error.message}`));
    });
  });
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