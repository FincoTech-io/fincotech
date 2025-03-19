import mongoose, { Document, Schema } from 'mongoose';

// Interface for User document
export interface IUser extends Document {
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
  role: 'CUSTOMER' | 'ADMIN' | 'CUSTOMER_SUPPORT' | 'MERCHANT' | 'DRIVER';
  lastLogin?: Date;
  isActive: boolean;
  pushToken?: string;
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
    },
  },
  {
    timestamps: true,
  }
);

// Add any custom methods or middleware here
// For example, password hashing before save:
// UserSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

// Create or retrieve the User model
export const User = mongoose.models.User as mongoose.Model<IUser> || 
  mongoose.model<IUser>('User', UserSchema);

export default User; 