import mongoose, { Document, Schema } from 'mongoose';

export interface ILedger extends Document {
    _id: mongoose.Types.ObjectId;
    entryId: string;
    transactionRef: string;
    entryDate: Date;
    account: string;
}

export const LedgerSchema = new Schema({
    entryId: {
        type: String,
        required: [true, 'Ledger entry ID is required'],
        unique: true,
        index: true,
      },
      transactionRef: {
        type: String,
        required: [true, 'Transaction reference is required'],
        index: true,
      },
      entryDate: {
        type: Date,
        default: Date.now,
      },
      account: {
        type: String,
        required: [true, 'Account is required'],
        enum: ['revenue', 'customer', 'merchant', 'operating', 'trust', 'system'],
      },
      debit: {
        type: Number,
        default: 0,
      },
      credit: {
        type: Number,
        default: 0,
      },
      balance: {
        type: Number,
        required: [true, 'Balance is required'],
      },
      currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      metadata: {
        entryType: {
          type: String,
          enum: ['fee', 'transfer', 'settlement', 'adjustment', 'other'],
          default: 'other',
        },
        region: {
          type: String,
          trim: true,
        },
        notes: {
          type: String,
          trim: true,
        },
      },
    },
    {
      timestamps: true,
});

// Create indexes for commonly queried fields
LedgerSchema.index({ entryDate: -1 });
LedgerSchema.index({ account: 1 });
LedgerSchema.index({ 'metadata.entryType': 1 });

const Ledger = mongoose.models.Ledger || mongoose.model<ILedger>('Ledger', LedgerSchema);

export default Ledger;


