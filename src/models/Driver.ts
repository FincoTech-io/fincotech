import mongoose, { Document, Schema } from 'mongoose';

// Interface for an embedded notification
export interface IEmbeddedNotification {
  _id?: string;
  title: string;
  message: string;
  creationTime: Date;
  isRead: boolean;
  type: 'UPDATE' | 'SYSTEM' | 'PROMOTIONAL' | 'SECURITY';
  pinned: boolean;
  metadata?: Record<string, any>;
}

// Interface for Driver document
export interface IDriver extends Document {
  _id: string;
  
  // Personal Information
  accountHolderName: string;
  
  // Banking Information
  bankAccountNumber: string;
  bankName: string;
  routingNumber: string;
  
  // Driver License Information
  licenseNumber: string;
  licenseExpiry: string;
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
  
  // Service Types
  serviceTypes: {
    rideShare: boolean;
    foodDelivery: boolean;
    groceryDelivery: boolean;
    packageDelivery: boolean;
  };
  
  // Availability
  availability: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  
  // Preferred Hours
  preferredHours: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
    lateNight: boolean;
  };
  
  maxDeliveryDistance: string;
  
  // Document Uploads
  documents: {
    licensePhotoFront?: {
      url: string;
      publicId: string;
      originalName?: string;
      uploadedAt: Date;
    };
    licensePhotoBack?: {
      url: string;
      publicId: string;
      originalName?: string;
      uploadedAt: Date;
    };
    registrationPhoto?: {
      url: string;
      publicId: string;
      originalName?: string;
      uploadedAt: Date;
    };
    insurancePhoto?: {
      url: string;
      publicId: string;
      originalName?: string;
      uploadedAt: Date;
    };
    profilePhoto?: {
      url: string;
      publicId: string;
      originalName?: string;
      uploadedAt: Date;
    };
  };
  
  // Status and Verification
  verificationStatus: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'DEACTIVATED';
  isActive: boolean;
  
  // Application Link
  applicationRef: string;
  applicantUserId: mongoose.Types.ObjectId;
  approvedBy: mongoose.Types.ObjectId;
  approvalDate: Date;
  
  // Driver Metrics
  totalRides: number;
  totalDeliveries: number;
  averageRating: number;
  totalEarnings: number;
  
  // Notifications
  hasUnreadNotifications: boolean;
  notifications: IEmbeddedNotification[];
  notificationPreferences: {
    rideRequests: {
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    paymentReceived: {
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    systemUpdates: {
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    security: {
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    promotions: {
      sms: boolean;
      push: boolean;
      email: boolean;
    };
  };
  
  // Location and Availability
  currentLocation?: {
    latitude: number;
    longitude: number;
    address?: string;
    lastUpdated: Date;
  };
  isOnline: boolean;
  lastSeen: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

// Document Upload Schema
const DocumentSchema = new Schema({
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

// Define the Driver schema
const DriverSchema = new Schema<IDriver>(
  {
    // Personal Information
    accountHolderName: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
      index: true,
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
      unique: true,
      index: true,
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
      unique: true,
      index: true,
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
    documents: {
      licensePhotoFront: DocumentSchema,
      licensePhotoBack: DocumentSchema,
      registrationPhoto: DocumentSchema,
      insurancePhoto: DocumentSchema,
      profilePhoto: DocumentSchema,
    },
    
    // Status and Verification
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'SUSPENDED', 'DEACTIVATED'],
      default: 'VERIFIED', // Drivers are created only when approved
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Application Link
    applicationRef: {
      type: String,
      required: [true, 'Application reference is required'],
      unique: true,
      index: true,
    },
    applicantUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Applicant user ID is required'],
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Approved by staff ID is required'],
    },
    approvalDate: {
      type: Date,
      required: [true, 'Approval date is required'],
    },
    
    // Driver Metrics
    totalRides: {
      type: Number,
      default: 0,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    
    // Notifications
    hasUnreadNotifications: {
      type: Boolean,
      default: false,
    },
    notifications: [
      {
        title: {
          type: String,
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        creationTime: {
          type: Date,
          default: Date.now,
        },
        isRead: {
          type: Boolean,
          default: false,
        },
        type: {
          type: String,
          enum: ['UPDATE', 'SYSTEM', 'PROMOTIONAL', 'SECURITY'],
          required: true,
        },
        pinned: {
          type: Boolean,
          default: false,
        },
        metadata: {
          type: Schema.Types.Mixed,
        },
      },
    ],
    notificationPreferences: {
      rideRequests: {
        sms: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: false,
        },
      },
      paymentReceived: {
        sms: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
      },
      systemUpdates: {
        sms: {
          type: Boolean,
          default: false,
        },
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
      },
      security: {
        sms: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
        email: {
          type: Boolean,
          default: true,
        },
      },
      promotions: {
        sms: {
          type: Boolean,
          default: false,
        },
        push: {
          type: Boolean,
          default: false,
        },
        email: {
          type: Boolean,
          default: false,
        },
      },
    },
    
    // Location and Availability
    currentLocation: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
      address: {
        type: String,
        trim: true,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
DriverSchema.index({ verificationStatus: 1, isActive: 1 });
DriverSchema.index({ licenseNumber: 1 }, { unique: true });
DriverSchema.index({ vehiclePlate: 1 }, { unique: true });
DriverSchema.index({ applicationRef: 1 }, { unique: true });
DriverSchema.index({ applicantUserId: 1 });
DriverSchema.index({ 'serviceTypes.rideShare': 1 });
DriverSchema.index({ 'serviceTypes.foodDelivery': 1 });
DriverSchema.index({ 'serviceTypes.groceryDelivery': 1 });
DriverSchema.index({ 'serviceTypes.packageDelivery': 1 });
DriverSchema.index({ isOnline: 1, isActive: 1 });

// Create or retrieve the Driver model
export const Driver = mongoose.models.Driver as mongoose.Model<IDriver> || 
  mongoose.model<IDriver>('Driver', DriverSchema);

export default Driver; 