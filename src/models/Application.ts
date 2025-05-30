import mongoose, { Document, Schema } from 'mongoose';

// Interface for uploaded documents
export interface IUploadedDocument {
  url: string;
  publicId: string;
  originalName?: string;
  uploadedAt: Date;
}

// Interface for Business Application
export interface IBusinessApplication {
  // Basic Business Information
  businessName: string;
  businessDescription: string;
  businessCategory: string;
  businessIndustry: string;
  businessType: string;
  businessWebsite?: string;
  yearEstablished: string;
  businessOwnershipPercentage: string;
  
  // Contact Information
  businessEmail: string;
  businessPhone: string;
  useCurrentPhone: boolean;
  
  // Address Information
  businessStreetAddress: string;
  businessCity: string;
  businessState: string;
  businessZipCode: string;
  businessCountry: string;
  businessAddress: string;
  
  // Legal & Compliance
  businessRegistrationNumber: string;
  businessLicense: string;
  taxId: string;
  vatNumber?: string;
  authorizedSignatory: string;
  signatoryTitle: string;
  
  // Banking Information
  businessBankName: string;
  businessAccountType: string;
  businessAccountNumber: string;
  businessRoutingNumber: string;
  
  // Business Operations
  primaryBusinessPurpose: string;
  averageTransactionAmount: string;
  expectedMonthlyVolume: string;
  
  // Document Uploads
  businessLicensePhoto?: IUploadedDocument;
  businessRegistrationDocument?: IUploadedDocument;
  businessInsuranceDocument?: IUploadedDocument;
  taxCertificatePhoto?: IUploadedDocument;
  
  // Staff and Notifications (from your original structure)
  businessStaff: Array<{
    name: string;
    role: string;
    email: string;
    phoneNumber: string;
  }>;
  advertisements: any[];
  notifications: any[];
  hasUnreadNotifications: boolean;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  currentAddress: string;
  currentRegion: string;
  verificationStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
}

// Interface for Driver Application
export interface IDriverApplication {
  // Personal Information
  accountHolderName: string;
  
  // Banking Information
  bankAccountNumber: string;
  bankName: string;
  routingNumber: string;
  
  // Driver License Information
  licenseNumber: string;
  licenseExpiry: string; // Date as string in MM/DD/YYYY format
  licenseState: string;
  licenseClass: string;
  
  // Vehicle Information
  hasVehicle: boolean;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehiclePlate: string;
  vehicleColor: string;
  vehicleCapacity: string;
  vehicleVIN?: string;
  
  // Insurance Information
  insuranceProvider?: string;
  insuranceExpiry?: string;
  
  // Service & Availability
  serviceTypes: {
    rideShare: boolean;
    foodDelivery: boolean;
    groceryDelivery: boolean;
    packageDelivery: boolean;
  };
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  preferredHours: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    lateNight: boolean;
  };
  maxDeliveryDistance: string;
  
  // Document Uploads
  licensePhotoFront?: IUploadedDocument;
  licensePhotoBack?: IUploadedDocument;
  registrationPhoto?: IUploadedDocument;
  insurancePhoto?: IUploadedDocument;
  profilePhoto?: IUploadedDocument;
  
  // Consent & Background
  backgroundCheckConsent: boolean;
  drivingRecordConsent: boolean;
  
  // Notifications and Status
  notifications: any[];
  hasUnreadNotifications: boolean;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  verificationStatus: 'pending' | 'under_review' | 'approved' | 'rejected';
}

// Main Application Interface
export interface IApplication extends Document {
  _id: mongoose.Types.ObjectId;
  applicationType: 'business' | 'driver';
  applicantUserId: mongoose.Types.ObjectId;
  applicationRef: string;
  
  // Application Data (one will be populated based on type)
  businessApplication?: IBusinessApplication;
  driverApplication?: IDriverApplication;
  
  // Application Status & Processing
  status: 'Pending' | 'In Review' | 'Approved' | 'Declined';
  submissionDate: Date;
  reviewDate?: Date;
  approvalDate?: Date;
  rejectionDate?: Date;
  
  // Review Information
  reviewedBy?: mongoose.Types.ObjectId;
  reviewNotes?: string;
  rejectionReason?: string;
  
  // Additional Metadata
  ipAddress?: string;
  userAgent?: string;
  source: 'mobile_app' | 'web' | 'api';
  
  createdAt: Date;
  updatedAt: Date;
}

// Document Upload Schema
const UploadedDocumentSchema = new Schema({
  url: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

// Business Application Schema
const BusinessApplicationSchema = new Schema({
  // Basic Business Information
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true,
  },
  businessDescription: {
    type: String,
    required: [true, 'Business description is required'],
    trim: true,
  },
  businessCategory: {
    type: String,
    required: [true, 'Business category is required'],
    trim: true,
  },
  businessIndustry: {
    type: String,
    required: [true, 'Business industry is required'],
    trim: true,
  },
  businessType: {
    type: String,
    required: [true, 'Business type is required'],
    enum: ['Sole Proprietorship', 'Partnership', 'Corporation', 'LLC', 'Non-Profit', 'Other'],
  },
  businessWebsite: {
    type: String,
    trim: true,
  },
  yearEstablished: {
    type: String,
    required: [true, 'Year established is required'],
  },
  businessOwnershipPercentage: {
    type: String,
    required: [true, 'Ownership percentage is required'],
  },
  
  // Contact Information
  businessEmail: {
    type: String,
    required: [true, 'Business email is required'],
    trim: true,
    lowercase: true,
  },
  businessPhone: {
    type: String,
    required: [true, 'Business phone is required'],
    trim: true,
  },
  useCurrentPhone: {
    type: Boolean,
    default: false,
  },
  
  // Address Information
  businessStreetAddress: {
    type: String,
    required: [true, 'Business street address is required'],
    trim: true,
  },
  businessCity: {
    type: String,
    required: [true, 'Business city is required'],
    trim: true,
  },
  businessState: {
    type: String,
    required: [true, 'Business state is required'],
    trim: true,
  },
  businessZipCode: {
    type: String,
    required: [true, 'Business zip code is required'],
    trim: true,
  },
  businessCountry: {
    type: String,
    required: [true, 'Business country is required'],
    trim: true,
  },
  businessAddress: {
    type: String,
    trim: true,
  },
  
  // Legal & Compliance
  businessRegistrationNumber: {
    type: String,
    required: [true, 'Business registration number is required'],
    trim: true,
  },
  businessLicense: {
    type: String,
    trim: true,
  },
  taxId: {
    type: String,
    required: [true, 'Tax ID is required'],
    trim: true,
  },
  vatNumber: {
    type: String,
    trim: true,
  },
  authorizedSignatory: {
    type: String,
    required: [true, 'Authorized signatory is required'],
    trim: true,
  },
  signatoryTitle: {
    type: String,
    required: [true, 'Signatory title is required'],
    trim: true,
  },
  
  // Banking Information
  businessBankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true,
  },
  businessAccountType: {
    type: String,
    required: [true, 'Account type is required'],
    trim: true,
  },
  businessAccountNumber: {
    type: String,
    required: [true, 'Account number is required'],
    trim: true,
  },
  businessRoutingNumber: {
    type: String,
    required: [true, 'Routing number is required'],
    trim: true,
  },
  
  // Business Operations
  primaryBusinessPurpose: {
    type: String,
    required: [true, 'Primary business purpose is required'],
    trim: true,
  },
  averageTransactionAmount: {
    type: String,
    required: [true, 'Average transaction amount is required'],
  },
  expectedMonthlyVolume: {
    type: String,
    required: [true, 'Expected monthly volume is required'],
  },
  
  // Document Uploads
  businessLicensePhoto: UploadedDocumentSchema,
  businessRegistrationDocument: UploadedDocumentSchema,
  businessInsuranceDocument: UploadedDocumentSchema,
  taxCertificatePhoto: UploadedDocumentSchema,
  
  // Staff and Additional Info
  businessStaff: [{
    name: String,
    role: String,
    email: String,
    phoneNumber: String,
  }],
  advertisements: [Schema.Types.Mixed],
  notifications: [Schema.Types.Mixed],
  hasUnreadNotifications: {
    type: Boolean,
    default: false,
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: true,
    },
    sms: {
      type: Boolean,
      default: true,
    },
  },
  currentAddress: String,
  currentRegion: String,
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending',
  },
});

// Driver Application Schema (Updated to match frontend)
const DriverApplicationSchema = new Schema({
  // Personal Information
  accountHolderName: {
    type: String,
    required: [true, 'Account holder name is required'],
    trim: true,
  },
  
  // Banking Information
  bankAccountNumber: {
    type: String,
    required: [true, 'Bank account number is required'],
    trim: true,
  },
  bankName: {
    type: String,
    required: [true, 'Bank name is required'],
    trim: true,
  },
  routingNumber: {
    type: String,
    required: [true, 'Routing number is required'],
    trim: true,
  },
  
  // Driver License Information
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    trim: true,
  },
  licenseExpiry: {
    type: String,
    required: [true, 'License expiry date is required'],
  },
  licenseState: {
    type: String,
    required: [true, 'License state is required'],
    trim: true,
  },
  licenseClass: {
    type: String,
    required: [true, 'License class is required'],
    trim: true,
  },
  
  // Vehicle Information
  hasVehicle: {
    type: Boolean,
    required: [true, 'Vehicle ownership status is required'],
  },
  vehicleType: {
    type: String,
    required: [true, 'Vehicle type is required'],
    trim: true,
  },
  vehicleMake: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
  },
  vehicleModel: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
  },
  vehicleYear: {
    type: String,
    required: [true, 'Vehicle year is required'],
  },
  vehiclePlate: {
    type: String,
    required: [true, 'Vehicle license plate is required'],
    trim: true,
  },
  vehicleColor: {
    type: String,
    required: [true, 'Vehicle color is required'],
    trim: true,
  },
  vehicleCapacity: {
    type: String,
    required: [true, 'Vehicle capacity is required'],
  },
  vehicleVIN: {
    type: String,
    trim: true,
  },
  
  // Insurance Information
  insuranceProvider: {
    type: String,
    trim: true,
  },
  insuranceExpiry: {
    type: String,
  },
  
  // Service Types
  serviceTypes: {
    rideShare: {
      type: Boolean,
      default: false,
    },
    foodDelivery: {
      type: Boolean,
      default: false,
    },
    groceryDelivery: {
      type: Boolean,
      default: false,
    },
    packageDelivery: {
      type: Boolean,
      default: false,
    },
  },
  
  // Availability
  availability: {
    monday: {
      type: Boolean,
      default: false,
    },
    tuesday: {
      type: Boolean,
      default: false,
    },
    wednesday: {
      type: Boolean,
      default: false,
    },
    thursday: {
      type: Boolean,
      default: false,
    },
    friday: {
      type: Boolean,
      default: false,
    },
    saturday: {
      type: Boolean,
      default: false,
    },
    sunday: {
      type: Boolean,
      default: false,
    },
  },
  
  // Preferred Hours
  preferredHours: {
    morning: {
      type: Boolean,
      default: false,
    },
    afternoon: {
      type: Boolean,
      default: false,
    },
    evening: {
      type: Boolean,
      default: false,
    },
    lateNight: {
      type: Boolean,
      default: false,
    },
  },
  
  maxDeliveryDistance: {
    type: String,
    required: [true, 'Maximum delivery distance is required'],
  },
  
  // Document Uploads
  licensePhotoFront: UploadedDocumentSchema,
  licensePhotoBack: UploadedDocumentSchema,
  registrationPhoto: UploadedDocumentSchema,
  insurancePhoto: UploadedDocumentSchema,
  profilePhoto: UploadedDocumentSchema,
  
  // Consent & Background
  backgroundCheckConsent: {
    type: Boolean,
    required: [true, 'Background check consent is required'],
  },
  drivingRecordConsent: {
    type: Boolean,
    required: [true, 'Driving record consent is required'],
  },
  
  // Notifications
  notifications: [Schema.Types.Mixed],
  hasUnreadNotifications: {
    type: Boolean,
    default: false,
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: true,
    },
    sms: {
      type: Boolean,
      default: true,
    },
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected'],
    default: 'pending',
  },
});

// Main Application Schema
const ApplicationSchema = new Schema<IApplication>(
  {
    applicationType: {
      type: String,
      required: [true, 'Application type is required'],
      enum: ['business', 'driver'],
    },
    applicantUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant user ID is required'],
      index: true,
    },
    applicationRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    // Application Data
    businessApplication: BusinessApplicationSchema,
    driverApplication: DriverApplicationSchema,
    
    // Application Status & Processing
    status: {
      type: String,
      enum: ['Pending', 'In Review', 'Approved', 'Declined'],
      default: 'Pending',
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },
    reviewDate: Date,
    approvalDate: Date,
    rejectionDate: Date,
    
    // Review Information
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
    },
    reviewNotes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    
    // Additional Metadata
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['mobile_app', 'web', 'api'],
      default: 'api',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance (only compound indexes and ones not already defined in field definitions)
ApplicationSchema.index({ applicationType: 1, status: 1 });
ApplicationSchema.index({ submissionDate: -1 });
ApplicationSchema.index({ status: 1, submissionDate: -1 });

// Create or retrieve the Application model
export const Application = mongoose.models.Application as mongoose.Model<IApplication> ||
  mongoose.model<IApplication>('Application', ApplicationSchema);

export default Application; 