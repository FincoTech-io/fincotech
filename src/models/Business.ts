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

// Interface for a merchant advertisement
export interface IAdvertisement {
  _id?: string;
  title: string;
  description: string;
  image: {
    url: string;
    publicId: string;
  };
  link: string;
  startDate: Date;
  endDate: Date;
  video: {
    url: string;
    publicId: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  clicks: number;
  views: number;
  impressions: number;
  location: string;
  category: string;
  targetAudience?: string;
  targetLocation?: string;
  targetGender?: string;
  targetAge?: number;
  targetIncome?: number;
  targetInterests?: string[];
  targetBehavior?: string;
  targetDevice?: string;
  targetOS?: string;
  targetBrowser?: string;
  targetLanguage?: string;
  targetKeywords?: string[];
}

// Interface for Business document
export interface IBusiness extends Document {
  _id: string;
  phoneNumber: string;
  email: string;
  businessName: string;
  businessType: 'RESTAURANT' | 'RETAIL' | 'MARKET' | 'SERVICE' | 'EDUCATIONAL' | 'ENTERTAINMENT' | 'HOTEL' | 'RENTAL' | 'TRANSPORTATION' | 'OTHER';
  businessAddress: string;
  businessLicense: string;
  businessStaff: {
    name: string;
    role: 'ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_MANAGER' | 'BUSINESS_STAFF';
    email: string;
    phoneNumber: string;
    userId: string;
    pushToken: string[];
  }[];
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  currentRegion: string;
  currentAddress: string;
  hasUnreadNotifications: boolean;
  notifications: IEmbeddedNotification[];
  advertisements?: IAdvertisement[];
  notificationPreferences: {
    paymentReceived: {
      roles: 'ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_MANAGER' | 'BUSINESS_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    paymentSent: {
      roles: 'ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_MANAGER' | 'BUSINESS_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    systemUpdates: {
      roles: 'ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_MANAGER' | 'BUSINESS_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    security: {
      roles: 'ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_MANAGER' | 'BUSINESS_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    promotions: {
      roles: 'ADMIN' | 'BUSINESS_OWNER' | 'BUSINESS_MANAGER' | 'BUSINESS_STAFF';
      sms: boolean;
      push: boolean;
      email: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const BusinessSchema = new Schema<IBusiness>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String, 
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
    },    
    businessType: {
      type: String,
      required: true,
    },
    businessAddress: {
      type: String, 
      required: true,
    },
    businessLicense: {
      type: String,
      required: true,
    },    
    businessStaff: {
      type: [{
        name: String,
        role: String,
        email: String,  
        phoneNumber: String,
        userId: String,
        pushToken: [String],
      }],
    },
    verificationStatus: {
      type: String,
      required: true,
    },
    currentRegion: {
      type: String,
      required: true,
    },  
    currentAddress: {   
      type: String,
      required: true,
    },
    hasUnreadNotifications: {
      type: Boolean,
      required: true,
    },        
    notifications: {
      type: [{
        title: {
          type: String,
          required: [true, 'Notification title is required'],
          trim: true,
        },
        message: {
          type: String,
          required: [true, 'Notification message is required'],
          trim: true,
        },
        creationTime: {
          type: Date,
          default: Date.now,
        },
        isRead: {
          type: Boolean,
          default: false,
        },    
        pinned: {
          type: Boolean,
          default: false,
        },
        type: {
          type: String,
          enum: ['UPDATE', 'SYSTEM', 'PROMOTIONAL', 'SECURITY'],
          required: [true, 'Notification type is required'],
        },
        metadata: {
          type: Schema.Types.Mixed,
          default: {},
        }
      }],
      default: [],
    },  
    advertisements: {
      type: [{
        title: String,
        description: String,
        image: {
          url: String,
          publicId: String,
        },  
        link: String,
        startDate: Date,
        endDate: Date,
        video: {
          url: String,
          publicId: String,
        },  
        isActive: Boolean,
        createdAt: Date,
        updatedAt: Date,
        clicks: Number,
        views: Number,
        impressions: Number,
        location: String,
        category: String,
        targetAudience: String,
        targetLocation: String,
        targetGender: String,
        targetAge: Number,
        targetIncome: Number,
        targetInterests: [String],  
        targetBehavior: String,
        targetDevice: String,
        targetOS: String,
        targetBrowser: String,
        targetLanguage: String,
        targetKeywords: [String],
      }]
    },
    notificationPreferences: {
      paymentReceived: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      paymentSent: {  
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      systemUpdates: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      security: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
      promotions: {
        roles: [String],
        sms: Boolean,
        push: Boolean,
        email: Boolean,
      },
    },
  },
  {
    timestamps: true,
  }
);



// Create or retrieve the User model
export const Business = mongoose.models.Business as mongoose.Model<IBusiness> || 
  mongoose.model<IBusiness>('Business', BusinessSchema);

export default Business; 