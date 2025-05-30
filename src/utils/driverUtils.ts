import { IDriverApplication } from '@/models/Application';
import { IDriver } from '@/models/Driver';
import Driver from '@/models/Driver';
import User from '@/models/User';

/**
 * Convert driver application data to driver data format
 */
export function convertApplicationToDriverData(
  driverApplication: IDriverApplication,
  applicantUserId: string,
  approvedByStaffId: string,
  applicationRef: string
): Partial<IDriver> {
  return {
    // Personal Information
    accountHolderName: driverApplication.accountHolderName,
    
    // Banking Information
    bankAccountNumber: driverApplication.bankAccountNumber,
    bankName: driverApplication.bankName,
    routingNumber: driverApplication.routingNumber,
    
    // Driver License Information
    licenseNumber: driverApplication.licenseNumber,
    licenseExpiry: driverApplication.licenseExpiry,
    licenseState: driverApplication.licenseState,
    licenseClass: driverApplication.licenseClass,
    
    // Vehicle Information
    hasVehicle: driverApplication.hasVehicle,
    vehicleType: driverApplication.vehicleType,
    vehicleMake: driverApplication.vehicleMake,
    vehicleModel: driverApplication.vehicleModel,
    vehicleYear: driverApplication.vehicleYear,
    vehiclePlate: driverApplication.vehiclePlate,
    vehicleColor: driverApplication.vehicleColor,
    vehicleCapacity: driverApplication.vehicleCapacity,
    vehicleVIN: driverApplication.vehicleVIN,
    
    // Insurance Information
    insuranceProvider: driverApplication.insuranceProvider,
    insuranceExpiry: driverApplication.insuranceExpiry,
    
    // Service Types
    serviceTypes: {
      rideShare: driverApplication.serviceTypes.rideShare,
      foodDelivery: driverApplication.serviceTypes.foodDelivery,
      groceryDelivery: driverApplication.serviceTypes.groceryDelivery,
      packageDelivery: driverApplication.serviceTypes.packageDelivery,
    },
    
    // Availability
    availability: {
      monday: driverApplication.availability.monday,
      tuesday: driverApplication.availability.tuesday,
      wednesday: driverApplication.availability.wednesday,
      thursday: driverApplication.availability.thursday,
      friday: driverApplication.availability.friday,
      saturday: driverApplication.availability.saturday,
      sunday: driverApplication.availability.sunday,
    },
    
    // Preferred Hours
    preferredHours: {
      morning: driverApplication.preferredHours.morning,
      afternoon: driverApplication.preferredHours.afternoon,
      evening: driverApplication.preferredHours.evening,
      lateNight: driverApplication.preferredHours.lateNight,
    },
    
    maxDeliveryDistance: driverApplication.maxDeliveryDistance,
    
    // Document Uploads - convert from application format to driver format
    documents: {
      licensePhotoFront: driverApplication.licensePhotoFront ? {
        url: driverApplication.licensePhotoFront.url,
        publicId: driverApplication.licensePhotoFront.publicId,
        originalName: driverApplication.licensePhotoFront.originalName,
        uploadedAt: driverApplication.licensePhotoFront.uploadedAt || new Date(),
      } : undefined,
      licensePhotoBack: driverApplication.licensePhotoBack ? {
        url: driverApplication.licensePhotoBack.url,
        publicId: driverApplication.licensePhotoBack.publicId,
        originalName: driverApplication.licensePhotoBack.originalName,
        uploadedAt: driverApplication.licensePhotoBack.uploadedAt || new Date(),
      } : undefined,
      registrationPhoto: driverApplication.registrationPhoto ? {
        url: driverApplication.registrationPhoto.url,
        publicId: driverApplication.registrationPhoto.publicId,
        originalName: driverApplication.registrationPhoto.originalName,
        uploadedAt: driverApplication.registrationPhoto.uploadedAt || new Date(),
      } : undefined,
      insurancePhoto: driverApplication.insurancePhoto ? {
        url: driverApplication.insurancePhoto.url,
        publicId: driverApplication.insurancePhoto.publicId,
        originalName: driverApplication.insurancePhoto.originalName,
        uploadedAt: driverApplication.insurancePhoto.uploadedAt || new Date(),
      } : undefined,
      profilePhoto: driverApplication.profilePhoto ? {
        url: driverApplication.profilePhoto.url,
        publicId: driverApplication.profilePhoto.publicId,
        originalName: driverApplication.profilePhoto.originalName,
        uploadedAt: driverApplication.profilePhoto.uploadedAt || new Date(),
      } : undefined,
    },
    
    // Status and Verification
    verificationStatus: 'VERIFIED',
    isActive: true,
    
    // Application Link
    applicationRef,
    applicantUserId: applicantUserId as any,
    approvedBy: approvedByStaffId as any,
    approvalDate: new Date(),
    
    // Driver Metrics (initialize to zero)
    totalRides: 0,
    totalDeliveries: 0,
    averageRating: 0,
    totalEarnings: 0,
    
    // Notifications - copy from application if available
    hasUnreadNotifications: driverApplication.hasUnreadNotifications || false,
    notifications: driverApplication.notifications || [],
    notificationPreferences: {
      rideRequests: {
        sms: driverApplication.notificationPreferences?.sms ?? true,
        push: driverApplication.notificationPreferences?.push ?? true,
        email: driverApplication.notificationPreferences?.email ?? false,
      },
      paymentReceived: {
        sms: driverApplication.notificationPreferences?.sms ?? true,
        push: driverApplication.notificationPreferences?.push ?? true,
        email: driverApplication.notificationPreferences?.email ?? true,
      },
      systemUpdates: {
        sms: false,
        push: true,
        email: true,
      },
      security: {
        sms: true,
        push: true,
        email: true,
      },
      promotions: {
        sms: false,
        push: false,
        email: false,
      },
    },
    
    // Location and Availability
    isOnline: false,
    lastSeen: new Date(),
  };
}

/**
 * Create a driver from an approved driver application
 */
export async function createDriverFromApplication(
  driverApplication: IDriverApplication,
  applicantUserId: string,
  approvedByStaffId: string,
  applicationRef: string
): Promise<{ success: boolean; driver?: any; error?: string }> {
  try {
    // Check if driver already exists
    const existingDriver = await Driver.findOne({ 
      $or: [
        { licenseNumber: driverApplication.licenseNumber },
        { vehiclePlate: driverApplication.vehiclePlate },
        { applicationRef }
      ]
    }).exec();

    if (existingDriver) {
      return {
        success: false,
        error: 'Driver with this license number, vehicle plate, or application reference already exists'
      };
    }

    // Convert application data to driver data
    const driverData = convertApplicationToDriverData(
      driverApplication,
      applicantUserId,
      approvedByStaffId,
      applicationRef
    );

    // Create new driver
    const newDriver = new Driver(driverData);
    await newDriver.save();

    // Update user's role to include DRIVER if not already present
    const user = await User.findById(applicantUserId);
    if (user && user.role !== 'DRIVER') {
      // Keep existing role but add driver capability
      user.role = 'DRIVER';
      await user.save();
    }

    console.log(`✅ Driver created successfully: ${newDriver._id} for application ${applicationRef}`);

    return {
      success: true,
      driver: {
        _id: newDriver._id,
        accountHolderName: newDriver.accountHolderName,
        licenseNumber: newDriver.licenseNumber,
        vehiclePlate: newDriver.vehiclePlate,
        applicationRef: newDriver.applicationRef,
        verificationStatus: newDriver.verificationStatus,
        createdAt: newDriver.createdAt
      }
    };

  } catch (error: any) {
    console.error('Error creating driver from application:', error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return {
        success: false,
        error: `Driver with this ${duplicateField} already exists`
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to create driver profile'
    };
  }
}

/**
 * Get all drivers for a user
 */
export async function getUserDrivers(userId: string): Promise<{ success: boolean; drivers?: any[]; error?: string }> {
  try {
    const drivers = await Driver.find({ 
      applicantUserId: userId,
      isActive: true 
    }).lean();

    return { success: true, drivers };

  } catch (error: any) {
    console.error('Error fetching user drivers:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch driver profiles'
    };
  }
}

/**
 * Validate driver data before creating
 */
export function validateDriverData(driverData: Partial<IDriver>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields validation
  if (!driverData.accountHolderName?.trim()) {
    errors.push('Account holder name is required');
  }

  if (!driverData.licenseNumber?.trim()) {
    errors.push('License number is required');
  }

  if (!driverData.vehiclePlate?.trim()) {
    errors.push('Vehicle license plate is required');
  }

  if (!driverData.applicationRef?.trim()) {
    errors.push('Application reference is required');
  }

  // Banking information
  if (!driverData.bankAccountNumber?.trim()) {
    errors.push('Bank account number is required');
  }

  if (!driverData.bankName?.trim()) {
    errors.push('Bank name is required');
  }

  // Vehicle information if hasVehicle is true
  if (driverData.hasVehicle) {
    if (!driverData.vehicleMake?.trim()) {
      errors.push('Vehicle make is required');
    }
    if (!driverData.vehicleModel?.trim()) {
      errors.push('Vehicle model is required');
    }
    if (!driverData.vehicleYear?.trim()) {
      errors.push('Vehicle year is required');
    }
  }

  // Service types - at least one must be selected
  const serviceTypes = driverData.serviceTypes;
  if (serviceTypes && !Object.values(serviceTypes).some(Boolean)) {
    errors.push('At least one service type must be selected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 