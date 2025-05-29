import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Configure Cloudinary (this should be done once)
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export interface UploadedDocument {
  url: string;
  publicId: string;
  originalName?: string;
  uploadedAt: Date;
}

/**
 * Upload base64 image to Cloudinary
 */
export async function uploadImageToCloudinary(
  base64Image: string, 
  folder: string, 
  originalName?: string
): Promise<UploadedDocument> {
  try {
    // Remove the data:image/xxx;base64, prefix if present
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    const result = await cloudinary.uploader.upload(`data:image/jpeg;base64,${base64Data}`, {
      folder: folder,
      resource_type: 'image',
      public_id: `${Date.now()}_${uuidv4()}`,
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:low' },
        { format: 'jpg' }
      ],
      timeout: 60000
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: originalName || 'uploaded_document',
      uploadedAt: new Date()
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

/**
 * Process file references in application data - OPTIMIZED VERSION
 * Handles both base64 data URLs and file:// URLs from mobile apps
 * Processes uploads in parallel for better performance
 */
export async function processDocumentUploads(
  applicationData: any,
  documentFields: string[],
  cloudinaryFolder: string
): Promise<any> {
  const processedData = { ...applicationData };
  
  // Collect all upload tasks to process in parallel
  const uploadTasks: Promise<void>[] = [];
  
  for (const field of documentFields) {
    const fieldValue = applicationData[field];
    
    if (fieldValue && typeof fieldValue === 'string') {
      // Create upload task for each field
      const uploadTask = (async () => {
        try {
          if (fieldValue.startsWith('data:image/')) {
            // Handle base64 data URLs directly
            console.log(`Starting upload for ${field} to Cloudinary...`);
            const uploadResult = await uploadImageToCloudinary(fieldValue, cloudinaryFolder, field);
            processedData[field] = uploadResult;
            console.log(`✅ Successfully uploaded ${field}: ${uploadResult.url}`);
            
          } else if (fieldValue.startsWith('file://')) {
            // Handle file:// URLs from mobile apps
            console.log(`⚠️ File reference found for ${field}: ${fieldValue}`);
            console.log('Note: File:// URLs need to be converted to base64 on the client side before submission');
            processedData[field] = null;
            
          } else if (fieldValue.length > 1000) {
            // Assume it's base64 data without proper data URL prefix
            console.log(`Starting upload for ${field} as raw base64 data...`);
            const uploadResult = await uploadImageToCloudinary(`data:image/jpeg;base64,${fieldValue}`, cloudinaryFolder, field);
            processedData[field] = uploadResult;
            console.log(`✅ Successfully uploaded ${field} (raw base64)`);
            
          } else {
            // Keep other string values as is (URLs, etc.)
            processedData[field] = fieldValue;
          }
          
        } catch (error) {
          console.error(`❌ Error processing ${field}:`, error);
          processedData[field] = null;
          // Don't throw here, just log and continue with other uploads
        }
      })();
      
      uploadTasks.push(uploadTask);
    }
  }
  
  // Wait for all uploads to complete in parallel
  if (uploadTasks.length > 0) {
    console.log(`🚀 Processing ${uploadTasks.length} document uploads in parallel...`);
    await Promise.allSettled(uploadTasks); // Use allSettled to handle individual failures
    console.log(`✅ Completed processing all document uploads`);
  }
  
  return processedData;
}

/**
 * Generate application reference number
 */
export function generateApplicationRef(type: 'business' | 'driver'): string {
  const prefix = type === 'business' ? 'BIZ' : 'DRV';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Validate business application data
 */
export function validateBusinessApplication(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  const requiredFields = [
    'businessName',
    'businessDescription', 
    'businessCategory',
    'businessIndustry',
    'businessType',
    'businessEmail',
    'businessPhone',
    'businessStreetAddress',
    'businessCity',
    'businessState',
    'businessZipCode',
    'businessCountry',
    'businessRegistrationNumber',
    'taxId',
    'authorizedSignatory',
    'signatoryTitle',
    'businessBankName',
    'businessAccountType',
    'businessAccountNumber',
    'businessRoutingNumber',
    'primaryBusinessPurpose',
    'averageTransactionAmount',
    'expectedMonthlyVolume'
  ];

  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }

  // Email validation
  if (data.businessEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.businessEmail)) {
    errors.push('Invalid business email format');
  }

  // Phone validation (basic)
  if (data.businessPhone && !/^[\+]?[\d\s\-\(\)]+$/.test(data.businessPhone)) {
    errors.push('Invalid business phone format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate driver application data (Updated to match frontend structure)
 */
export function validateDriverApplication(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required string fields
  const requiredStringFields = [
    'accountHolderName',
    'bankAccountNumber',
    'bankName',
    'routingNumber',
    'licenseNumber',
    'licenseExpiry',
    'licenseState',
    'licenseClass',
    'vehicleType',
    'vehicleMake',
    'vehicleModel',
    'vehicleYear',
    'vehiclePlate',
    'vehicleColor',
    'vehicleCapacity',
    'maxDeliveryDistance'
  ];

  for (const field of requiredStringFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push(`${field} is required`);
    }
  }

  // Required boolean fields
  const requiredBooleanFields = [
    'hasVehicle',
    'backgroundCheckConsent',
    'drivingRecordConsent'
  ];

  for (const field of requiredBooleanFields) {
    if (data[field] === undefined || data[field] === null) {
      errors.push(`${field} is required`);
    }
  }

  // Validate service types - at least one must be selected
  if (data.serviceTypes) {
    const hasService = Object.values(data.serviceTypes).some(value => value === true);
    if (!hasService) {
      errors.push('At least one service type must be selected');
    }
  } else {
    errors.push('Service types are required');
  }

  // Validate availability - at least one day must be selected
  if (data.availability) {
    const hasAvailability = Object.values(data.availability).some(value => value === true);
    if (!hasAvailability) {
      errors.push('At least one availability day must be selected');
    }
  } else {
    errors.push('Availability days are required');
  }

  // Validate preferred hours - at least one time slot must be selected
  if (data.preferredHours) {
    const hasPreferredHours = Object.values(data.preferredHours).some(value => value === true);
    if (!hasPreferredHours) {
      errors.push('At least one preferred hour slot must be selected');
    }
  } else {
    errors.push('Preferred hours are required');
  }

  // License expiry validation (MM/DD/YYYY format)
  if (data.licenseExpiry) {
    const licenseDate = new Date(data.licenseExpiry);
    const today = new Date();
    
    if (isNaN(licenseDate.getTime())) {
      errors.push('Invalid license expiry date format');
    } else if (licenseDate <= today) {
      errors.push('Driver license must not be expired');
    }
  }

  // Vehicle year validation
  if (data.vehicleYear) {
    const year = parseInt(data.vehicleYear);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1990 || year > currentYear + 1) {
      errors.push('Invalid vehicle year');
    }
  }

  // Vehicle capacity validation
  if (data.vehicleCapacity) {
    const capacity = parseInt(data.vehicleCapacity);
    if (isNaN(capacity) || capacity < 1 || capacity > 50) {
      errors.push('Vehicle capacity must be between 1 and 50');
    }
  }

  // Max delivery distance validation
  if (data.maxDeliveryDistance) {
    const distance = parseInt(data.maxDeliveryDistance);
    if (isNaN(distance) || distance < 1 || distance > 100) {
      errors.push('Maximum delivery distance must be between 1 and 100 km');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Get document fields for business applications
 */
export function getBusinessDocumentFields(): string[] {
  return [
    'businessLicensePhoto',
    'businessRegistrationDocument', 
    'businessInsuranceDocument',
    'taxCertificatePhoto'
  ];
}

/**
 * Get document fields for driver applications (Updated)
 */
export function getDriverDocumentFields(): string[] {
  return [
    'licensePhotoFront',
    'licensePhotoBack',
    'registrationPhoto',
    'insurancePhoto',
    'profilePhoto'
  ];
}

/**
 * Get Cloudinary folder path for application type
 */
export function getCloudinaryFolder(applicationType: 'business' | 'driver'): string {
  return `fincotech/applications/${applicationType}`;
}

/**
 * Sanitize and format application data
 */
export function sanitizeApplicationData(data: any): any {
  const sanitized = { ...data };
  
  // Remove any null or undefined values (except for boolean false)
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === null || sanitized[key] === undefined) {
      delete sanitized[key];
    }
    
    // Trim string values
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitized[key].trim();
    }
  });
  
  return sanitized;
}

/**
 * Transform driver data from frontend format to backend format
 * Handles any field name mappings and data transformations
 */
export function transformDriverData(frontendData: any): any {
  const transformed = { ...frontendData };
  
  // Add default notification preferences if not provided
  if (!transformed.notificationPreferences) {
    transformed.notificationPreferences = {
      email: true,
      push: true,
      sms: true
    };
  }
  
  // Add default values for other fields if not provided
  if (!transformed.notifications) {
    transformed.notifications = [];
  }
  
  if (transformed.hasUnreadNotifications === undefined) {
    transformed.hasUnreadNotifications = false;
  }
  
  if (!transformed.verificationStatus) {
    transformed.verificationStatus = 'Pending';
  }
  
  return transformed;
} 