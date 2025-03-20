import mongoose, { Document, Schema } from 'mongoose';

export interface IFeeConfig extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    feeType: string;
    transactionType: string;
    calculationType: string;
    fixedAmount: number;
    percentageRate: number;
    currency: string;
    minimumFee: number;
    maximumFee: number;
    tieredRates: Array<{
        minAmount: number;
        maxAmount: number;
    }>;
    applicableTiers: Array<string>;
    applicableRegions: Array<string>;
    isActive: boolean;
    effectiveStartDate: Date;
    effectiveEndDate: Date;
    description: string;
    metadata: {
        createdBy: string;
        notes: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const FeeConfigSchema = new Schema({
    name: {
        type: String,
        required: [true, 'Fee configuration name is required'],
        trim: true,
    },
    feeType: {
        type: String,
        required: [true, 'Fee type is required'],
        enum: ['transaction_fee', 'processing_fee', 'service_fee', 'withdrawal_fee'],
    },
    transactionType: {
        type: String,
        required: [true, 'Transaction type is required'],
        enum: ['transfer', 'deposit', 'withdrawal', 'all'],
        default: 'all',
    },
    calculationType: {
        type: String,
        required: [true, 'Calculation type is required'],
        enum: ['percentage', 'fixed', 'tiered', 'hybrid'],
    },
    fixedAmount: {
        type: Number,
        default: 0,
    },
    percentageRate: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
        trim: true,
    },
    minimumFee: {
        type: Number,
        default: 0,
    },
    maximumFee: {
        type: Number,
        default: 0,
    },
    tieredRates: [
        {
        minAmount: {
            type: Number,
            required: [true, 'Minimum amount for tier is required'],
        },
        maxAmount: {
            type: Number,
            required: [true, 'Maximum amount for tier is required'],
        },
        fixedAmount: {
            type: Number,
            default: 0,
        },
        percentageRate: {
            type: Number,
            default: 0,
        },
        },
    ],
    applicableTiers: {
        type: [String],
        enum: ['BASIC', 'STANDARD', 'PREMIUM', 'VIP', 'ALL'],
        default: ['ALL'],
    },
    applicableRegions: {
        type: [String],
        default: ['GLOBAL'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    effectiveStartDate: {
        type: Date,
        default: Date.now,
    },
    effectiveEndDate: {
        type: Date,
    },
    description: {
        type: String,
        trim: true,
    },
    metadata: {
        createdBy: {
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

FeeConfigSchema.index({ feeType: 1, transactionType: 1, currency: 1, isActive: 1 });
FeeConfigSchema.index({ 'applicableTiers': 1 });
FeeConfigSchema.index({ 'applicableRegions': 1 });
FeeConfigSchema.index({ isActive: 1 });

const FeeConfig = mongoose.models.FeeConfig || mongoose.model<IFeeConfig>('FeeConfig', FeeConfigSchema);

export default FeeConfig;
