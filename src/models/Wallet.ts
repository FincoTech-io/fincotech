import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

// Interface for Wallet document
export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  address: string;
  fullName: string;
  phoneNumber: string;
  balance: number;
  currency: string;
  isActive: boolean;
  privacy: boolean;
  tier: 'BASIC' | 'STANDARD' | 'PREMIUM' | 'VIP';
  monthlyTransactionCount: number;
  lastTransactionReset: Date;
  transfersReceived: Array<{
    transactionId: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
    from: mongoose.Types.ObjectId | IUser;
  }>;
  transfersSent: Array<{
    transactionId: mongoose.Types.ObjectId;
    amount: number;
    date: Date;
    to: mongoose.Types.ObjectId | IUser;
  }>;
  contacts: Array<{
    userId: mongoose.Types.ObjectId | IUser;
    nickname: string;
    lastTransactionDate: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Wallet schema
const WalletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
      index: true,
    },
    address: {
      type: String,
      unique: true,
      // Will be created as a bcrypt hash of the wallet ID
    },
    fullName: {
      type: String,
      trim: true,
      // Will be populated from the user's full name
    },
    phoneNumber: {
      type: String,
      trim: true,
      // Will be populated from the user's phone number
    },
    balance: {
      type: Number,
      default: 0,
      get: (v: number) => parseFloat(v.toFixed(2)), // Format as double with 2 decimal places
      set: (v: number) => parseFloat(v.toFixed(2)), // Ensure values are stored with 2 decimal places
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    privacy: {
      type: Boolean,
      default: false,
    },
    tier: {
      type: String,
      enum: ['BASIC', 'STANDARD', 'PREMIUM', 'VIP'],
      default: 'STANDARD',
      uppercase: true,
    },
    monthlyTransactionCount: {
      type: Number,
      default: 0,
    },
    lastTransactionReset: {
      type: Date,
      default: Date.now,
    },
    transfersReceived: {
      type: [
        {
          transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
          },
          amount: Number,
          date: Date,
          from: {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        },
      ],
      default: [],
    },
    transfersSent: {
      type: [
        {
          transactionId: {
            type: Schema.Types.ObjectId,
            ref: 'Transaction',
          },
          amount: Number,
          date: Date,
          to: {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
        },
      ],
      default: [],
    },
    contacts: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
          },
          nickname: String,
          lastTransactionDate: Date,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create or retrieve the Wallet model
export const Wallet = mongoose.models.Wallet as mongoose.Model<IWallet> ||
  mongoose.model<IWallet>('Wallet', WalletSchema);

export default Wallet;
