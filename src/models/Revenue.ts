import mongoose, { Document, Schema } from 'mongoose';

export interface IRevenue extends Document {
    _id: mongoose.Types.ObjectId;
    transactionRef: string;
    revenueAmount: number;
    currency: string;
    revenueType: string;
    status: string;
    metadata: mongoose.Types.ObjectId;  
    createdAt: Date;
    updatedAt: Date;
}

export const RevenueSchema = new Schema({
    transactionRef: {
        type: String,
        required: [true, 'Revenue transaction reference is required'],
        unique: true,
        index: true,
      },
      transactionDate: {
        type: Date,
        default: Date.now,
      },
      associatedTransactionRef: {
        type: String,
        required: [true, 'Associated transaction reference is required'],
        index: true,
      },
      revenueAmount: {
        amount: {
          type: Number,
          required: [true, 'Revenue amount is required'],
        },
        currency: {
          type: String,
          default: 'USD',
          uppercase: true,
          trim: true,
        },
      },
      settlementDate: {
        type: Date,
      },
      status: {
        type: String,
        required: [true, 'Status is required'],
        enum: ['pending', 'settled'],
        default: 'pending',
      },
      revenueType: {
        type: String,
        required: [true, 'Revenue type is required'],
        enum: ['transaction_fee', 'processing_fee', 'service_fee', 'withdrawal_fee'],
      },
      metadata: {
        description: {
          type: String,
          trim: true,
        },
        settlementBatch: {
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
      },
    },
    {
      timestamps: true,

})

// Create indexes for commonly queried fields
RevenueSchema.index({ transactionDate: -1 });
RevenueSchema.index({ settlementDate: -1 });
RevenueSchema.index({ status: 1 });
RevenueSchema.index({ revenueType: 1 });


const Revenue = mongoose.models.Revenue || mongoose.model<IRevenue>('Revenue', RevenueSchema);

export default Revenue;


