import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
    _id: mongoose.Types.ObjectId;
    transactionRef: string;
    reference: string;
    transactionDate: Date;
    transactionType: string;
    status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    sender: {
        _id: mongoose.Types.ObjectId;
        fullName: string;
        accountRole: 'customer' | 'admin' | 'merchant' | 'driver';
        walletTier: string;
        phoneNumber: string;
    }
    receiver: {
        _id: mongoose.Types.ObjectId;
        fullName: string;
        accountRole: string;
        walletTier: string;
        phoneNumber: string;
    }
    transferAmount: number;
    fees: Array<{
        feeAmount: number;
        currency: string;
        feeType: string;
        description: string;
        revenueStatus: 'pending' | 'paid' | 'failed' | 'refunded';
        _id: mongoose.Types.ObjectId;
    }>;
    metadata: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export const TransactionSchema = new Schema<ITransaction>({
    transactionRef: {
        type: String,
        required: [true, 'Transaction reference is required'],
        unique: true,
        index: true,
      },
      reference: {
        type: String,
        index: true,
        sparse: true
      },
      transactionDate: {
        type: Date,
        default: Date.now,
      },
      transactionType: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: ['transfer', 'deposit', 'withdrawal', 'fee', 'refund'],
      },
      status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
      },
      sender: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: [true, 'Sender ID is required'],
        },
        fullName: {
          type: String,
          trim: true,
        },
        accountRole: {
          type: String,
          default: 'customer',
        },
        walletTier: {
          type: String,
          trim: true,
        },
        phoneNumber: {
          type: String,
          trim: true,
          required: [true, 'Sender phone number is required'],
        },
      },
      receiver: {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: [true, 'Receiver ID is required'],
        },
        fullName: {
          type: String,
          trim: true,
        },
        accountRole: {
          type: String,
          default: 'customer',
        },
        walletTier: {
          type: String,
          trim: true,
        },
        phoneNumber: {
          type: String,
          trim: true,
          required: [true, 'Receiver phone number is required'],
        },
      },
      transferAmount: {
        amount: {
          type: Number,
          required: [true, 'Transfer amount is required'],
        },
        currency: {
          type: String,
          default: 'USD',
          uppercase: true,
          trim: true,
        },
      },
      fees: [
        {
          feeAmount: {
            type: Number,
            required: [true, 'Fee amount is required'],
          },
          currency: {
            type: String,
            default: 'USD',
            uppercase: true,
            trim: true,
          },
          feeType: {
            type: String,
            required: [true, 'Fee type is required'],
            enum: ['transaction_fee', 'processing_fee', 'service_fee', 'withdrawal_fee'],
          },
          description: {
            type: String,
            trim: true,
          },
          revenueStatus: {
            type: String,
            enum: ['pending', 'settled'],
            default: 'pending',
          },
          settlementDate: {
            type: Date,
          },
        },
      ],
      metadata: {
        source: {
          type: String,
          enum: ['mobile_app', 'web', 'api', 'admin', 'system'],
          default: 'api',
        },
        ipAddress: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
        region: {
          type: String,
          trim: true,
        },
        deviceInfo: {
          type: String,
          trim: true,
        },
      },
    },
    {
      timestamps: true,
})

TransactionSchema.index({ transactionRef: 1, reference: 1 }, { unique: true });
TransactionSchema.index({ sender: 1, receiver: 1 });
TransactionSchema.index({ transactionDate: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ 'fees.feeType': 1 });
TransactionSchema.index({ 'fees.currency': 1 });
TransactionSchema.index({ 'fees.revenueStatus': 1 });
TransactionSchema.index({ 'sender.phoneNumber': 1 });
TransactionSchema.index({ 'receiver.phoneNumber': 1 });


const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
