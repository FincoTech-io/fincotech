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

// Interface for User document
export interface IUser extends Document {
  _id: string;
  phoneNumber: string;
  pin: string;
  security: {
    question: string;
    answer: string;
  };
  fullName: string;
  profileImage: {
    url: string;
    publicId: string;
  };
  nationality: string;
  idType: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
  idNumber: string;
  email: string;
  isVerified: boolean;
  idVerification: {
    frontImg?: string;
    backImg?: string;
    facialData?: string;
  };
  role: 'CUSTOMER';
  lastLogin?: Date;
  isActive: boolean;
  pushToken?: string;
  currentRegion?: string;
  currentAddress?: string;
  hasUnreadNotifications: boolean;
  merchantAccess?: {
    userRole: 'ADMIN' | 'MERCHANT_OWNER' | 'MERCHANT_MANAGER' | 'MERCHANT_STAFF';
    merchantId: string;
    merchantName: string;
  }[];
  driverAccountId?: string;
  notifications: IEmbeddedNotification[];
  notificationPreferences: {
    paymentReceived: {
      sms: boolean;
      push: boolean;
      email: boolean;
    };
    paymentSent: {
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
  createdAt: Date;
  updatedAt: Date;
}

// Define the User schema
const UserSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      unique: true,
      index: true,
    },
    pin: {
      type: String,
      required: [true, 'PIN is required'],
      minlength: [4, 'PIN must be at least 4 characters'],
      maxlength: [60, 'PIN cannot exceed 60 characters (when hashed)'],
    },
    security: {
      question: {
        type: String,
        required: [true, 'Security question is required'],
        trim: true,
      },
      answer: {
        type: String,
        required: [true, 'Security answer is required'],
        trim: true,
      },
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    profileImage: {
      url: {
        type: String,
        default: 'https://res.cloudinary.com/demo/image/upload/v1/fincotech/profiles/default-profile'
      },
      publicId: {
        type: String,
        default: 'fincotech/profiles/default-profile'
      }
    },
    nationality: {
      type: String,
      required: [true, 'Nationality is required'],
      trim: true,
    },
    idType: {
      type: String,
      required: [true, 'ID type is required'],
      enum: ['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID'],
      uppercase: true,
    },
    idNumber: {
      type: String,
      required: [true, 'ID number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    idVerification: {
      frontImg: {
        type: String,
        trim: true,
      },
      backImg: {
        type: String,
        trim: true,
      },
      facialData: {
        type: String,
        trim: true,
      },
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'CUSTOMER_SUPPORT', 'MERCHANT', 'DRIVER'],
      default: 'CUSTOMER',
      uppercase: true,
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    pushToken: {
      type: String,
      trim: true,
      default: null,
    },
    hasUnreadNotifications: {
      type: Boolean,
      default: false,
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
    notificationPreferences: {
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
          default: false,
        },
      },
      paymentSent: {
        sms: {
          type: Boolean,
          default: true,
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
  },
  {
    timestamps: true,
  }
);

// Create or retrieve the User model
export const User = mongoose.models.User as mongoose.Model<IUser> || 
  mongoose.model<IUser>('User', UserSchema);

export default User; 