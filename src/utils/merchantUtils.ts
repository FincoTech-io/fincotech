import { IBusinessApplication } from '@/models/Application';
import { IMerchant } from '@/models/Merchant';
import Merchant from '@/models/Merchant';
import { createWallet } from '@/utils/walletUtils';

/**
 * Convert business application data to merchant data format
 */
export function convertApplicationToMerchantData(
  businessApplication: IBusinessApplication,
  applicantUserId: string,
  approvedByStaffId: string
): Partial<IMerchant> {
  // Map business category/industry to merchant type
  const getMerchantType = (category: string, industry: string): 'RESTAURANT' | 'RETAIL' | 'MARKET' | 'SERVICE' | 'EDUCATIONAL' | 'ENTERTAINMENT' | 'HOTEL' | 'RENTAL' | 'TRANSPORTATION' | 'OTHER' => {
    const categoryLower = category.toLowerCase();
    const industryLower = industry.toLowerCase();
    
    if (categoryLower.includes('restaurant') || categoryLower.includes('food') || industryLower.includes('food')) {
      return 'RESTAURANT';
    } else if (categoryLower.includes('retail') || industryLower.includes('retail')) {
      return 'RETAIL';
    } else if (categoryLower.includes('market') || industryLower.includes('market')) {
      return 'MARKET';
    } else if (categoryLower.includes('service') || industryLower.includes('service')) {
      return 'SERVICE';
    } else if (categoryLower.includes('education') || industryLower.includes('education')) {
      return 'EDUCATIONAL';
    } else if (categoryLower.includes('entertainment') || industryLower.includes('entertainment')) {
      return 'ENTERTAINMENT';
    } else if (categoryLower.includes('hotel') || categoryLower.includes('hospitality') || industryLower.includes('hotel')) {
      return 'HOTEL';
    } else if (categoryLower.includes('rental') || industryLower.includes('rental')) {
      return 'RENTAL';
    } else if (categoryLower.includes('transport') || industryLower.includes('transport')) {
      return 'TRANSPORTATION';
    } else {
      return 'OTHER';
    }
  };

  // Combine address fields
  const fullAddress = [
    businessApplication.businessStreetAddress,
    businessApplication.businessCity,
    businessApplication.businessState,
    businessApplication.businessZipCode,
    businessApplication.businessCountry
  ].filter(Boolean).join(', ');

  // Default notification preferences with proper types
  const defaultNotificationPreferences = {
    paymentReceived: {
      roles: 'MERCHANT_OWNER' as const,
      sms: true,
      push: true,
      email: true,
    },
    paymentSent: {
      roles: 'MERCHANT_OWNER' as const,
      sms: true,
      push: true,
      email: true,
    },
    systemUpdates: {
      roles: 'MERCHANT_OWNER' as const,
      sms: true,
      push: true,
      email: true,
    },
    security: {
      roles: 'MERCHANT_OWNER' as const,
      sms: true,
      push: true,
      email: true,
    },
    promotions: {
      roles: 'MERCHANT_OWNER' as const,
      sms: false,
      push: false,
      email: true,
    },
  };

  return {
    phoneNumber: businessApplication.businessPhone,
    email: businessApplication.businessEmail,
    merchantName: businessApplication.businessName,
    merchantType: getMerchantType(businessApplication.businessCategory, businessApplication.businessIndustry),
    merchantAddress: fullAddress,
    merchantLicense: businessApplication.businessRegistrationNumber,
    merchantStaff: [{
      name: businessApplication.authorizedSignatory,
      role: 'MERCHANT_OWNER' as const,
      email: businessApplication.businessEmail,
      phoneNumber: businessApplication.businessPhone,
      userId: applicantUserId,
      pushToken: [],
    }],
    verificationStatus: 'VERIFIED' as const,
    currentRegion: businessApplication.currentRegion || 'global',
    currentAddress: businessApplication.currentAddress || fullAddress,
    hasUnreadNotifications: false,
    notifications: [],
    advertisements: [],
    notificationPreferences: defaultNotificationPreferences,
  };
}

/**
 * Create a merchant from an approved business application
 */
export async function createMerchantFromApplication(
  businessApplication: IBusinessApplication,
  applicantUserId: string,
  approvedByStaffId: string,
  applicationRef: string
): Promise<{ success: boolean; merchant?: any; error?: string }> {
  try {
    // Check if merchant already exists
    const normalizedPhone = businessApplication.businessPhone.replace(/\s+/g, '');
    const existingMerchant = await Merchant.findOne({ 
      phoneNumber: { $regex: new RegExp('^' + normalizedPhone.replace(/[+]/g, '\\$&') + '$', 'i') } 
    }).exec();

    if (existingMerchant) {
      return {
        success: false,
        error: 'Merchant with this phone number already exists'
      };
    }

    // Convert application data to merchant format
    const merchantData = convertApplicationToMerchantData(
      businessApplication,
      applicantUserId,
      approvedByStaffId
    );

    // Add metadata about the application
    const merchantWithMetadata = {
      ...merchantData,
      applicationRef, // Link to original application
      approvedBy: approvedByStaffId,
      approvedAt: new Date(),
    };

    // Create the merchant
    const newMerchant = new Merchant(merchantWithMetadata);
    await newMerchant.save();

    // 🔥 NEW: Update user's merchantAccess to create two-way link
    try {
      const User = (await import('@/models/User')).default;
      await User.findByIdAndUpdate(
        applicantUserId,
        {
          $push: {
            merchantAccess: {
              userRole: 'MERCHANT_OWNER',
              merchantId: newMerchant._id.toString(),
              merchantName: businessApplication.businessName
            }
          }
        }
      );
      console.log(`✅ Added merchant access to user ${applicantUserId}`);
    } catch (userUpdateError) {
      console.error('Error updating user merchantAccess:', userUpdateError);
      // Don't fail merchant creation if user update fails
    }

    // Create wallet for the merchant
    try {
      const merchantId = newMerchant._id.toString();
      console.log('Creating wallet for new merchant:', merchantId);
      const walletResult = await createWallet(merchantId, 'MERCHANT');
      console.log('Wallet created successfully:', walletResult.wallet.address);
    } catch (walletError) {
      console.error('Error creating wallet for merchant:', walletError);
      // Don't fail merchant creation if wallet fails
    }

    return {
      success: true,
      merchant: newMerchant
    };

  } catch (error) {
    console.error('Error creating merchant from application:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create merchant'
    };
  }
}

/**
 * Get merchant type options for dropdowns/validation
 */
export const MERCHANT_TYPES = [
  'RESTAURANT',
  'RETAIL', 
  'MARKET',
  'SERVICE',
  'EDUCATIONAL',
  'ENTERTAINMENT',
  'HOTEL',
  'RENTAL',
  'TRANSPORTATION',
  'OTHER'
] as const;

/**
 * Validate merchant data before creation
 */
export function validateMerchantData(merchantData: Partial<IMerchant>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredFields = [
    'phoneNumber',
    'email', 
    'merchantName',
    'merchantType',
    'merchantAddress',
    'merchantLicense'
  ];

  for (const field of requiredFields) {
    if (!merchantData[field as keyof IMerchant] || 
        (typeof merchantData[field as keyof IMerchant] === 'string' && 
         (merchantData[field as keyof IMerchant] as string).trim() === '')) {
      errors.push(`${field} is required`);
    }
  }

  // Email validation
  if (merchantData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(merchantData.email)) {
    errors.push('Invalid email format');
  }

  // Phone validation
  if (merchantData.phoneNumber && !/^[\+]?[\d\s\-\(\)]+$/.test(merchantData.phoneNumber)) {
    errors.push('Invalid phone number format');
  }

  // Merchant type validation
  if (merchantData.merchantType && !MERCHANT_TYPES.includes(merchantData.merchantType as any)) {
    errors.push('Invalid merchant type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get all merchants a user has access to
 */
export async function getUserMerchants(userId: string): Promise<{ success: boolean; merchants?: any[]; error?: string }> {
  try {
    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).select('merchantAccess').lean();
    
    if (!user || !user.merchantAccess || user.merchantAccess.length === 0) {
      return { success: true, merchants: [] };
    }

    // Get full merchant details
    const merchantIds = user.merchantAccess.map(access => access.merchantId);
    const merchants = await Merchant.find({ _id: { $in: merchantIds } }).lean();

    // Combine merchant data with user's role information
    const merchantsWithRoles = merchants.map(merchant => {
      const userAccess = user.merchantAccess?.find(
        access => access.merchantId === merchant._id.toString()
      );
      return {
        ...merchant,
        userRole: userAccess?.userRole
      };
    });

    return { success: true, merchants: merchantsWithRoles };
  } catch (error) {
    console.error('Error getting user merchants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user merchants'
    };
  }
}

/**
 * Check if a user has access to a specific merchant
 */
export async function checkUserMerchantAccess(
  userId: string, 
  merchantId: string
): Promise<{ hasAccess: boolean; role?: string; error?: string }> {
  try {
    const User = (await import('@/models/User')).default;
    const user = await User.findById(userId).select('merchantAccess').lean();
    
    if (!user?.merchantAccess) {
      return { hasAccess: false };
    }

    const access = user.merchantAccess.find(
      access => access.merchantId === merchantId
    );

    return {
      hasAccess: !!access,
      role: access?.userRole
    };
  } catch (error) {
    console.error('Error checking user merchant access:', error);
    return {
      hasAccess: false,
      error: error instanceof Error ? error.message : 'Failed to check access'
    };
  }
}

/**
 * Add a user to a merchant's staff (for manual merchant management)
 */
export async function addUserToMerchant(
  userId: string,
  merchantId: string,
  role: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF',
  addedByStaffId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const User = (await import('@/models/User')).default;
    
    // Get user details
    const user = await User.findById(userId).select('fullName email phoneNumber').lean();
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Get merchant details
    const merchant = await Merchant.findById(merchantId);
    if (!merchant) {
      return { success: false, error: 'Merchant not found' };
    }

    // Check if user is already in merchant staff
    const existingStaff = merchant.merchantStaff.find(staff => staff.userId === userId);
    if (existingStaff) {
      return { success: false, error: 'User is already a staff member of this merchant' };
    }

    // Add to merchant staff
    merchant.merchantStaff.push({
      name: user.fullName,
      role,
      email: user.email,
      phoneNumber: user.phoneNumber,
      userId,
      pushToken: []
    });
    await merchant.save();

    // Add to user's merchant access
    await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          merchantAccess: {
            userRole: role,
            merchantId: merchantId,
            merchantName: merchant.merchantName
          }
        }
      }
    );

    console.log(`✅ Added user ${userId} to merchant ${merchantId} as ${role}`);
    return { success: true };

  } catch (error) {
    console.error('Error adding user to merchant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add user to merchant'
    };
  }
}

/**
 * Remove a user from a merchant's staff
 */
export async function removeUserFromMerchant(
  userId: string,
  merchantId: string,
  removedByStaffId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const User = (await import('@/models/User')).default;

    // Remove from merchant staff
    await Merchant.findByIdAndUpdate(
      merchantId,
      {
        $pull: {
          merchantStaff: { userId: userId }
        }
      }
    );

    // Remove from user's merchant access
    await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          merchantAccess: { merchantId: merchantId }
        }
      }
    );

    console.log(`✅ Removed user ${userId} from merchant ${merchantId}`);
    return { success: true };

  } catch (error) {
    console.error('Error removing user from merchant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove user from merchant'
    };
  }
} 