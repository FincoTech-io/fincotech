import mongoose, { Document, Schema } from 'mongoose';

// Interface for Notification document
export interface INotification extends Document {
  _id: string;
  recipientId: Schema.Types.ObjectId;
  title: string;
  message: string;
  creationTime: Date;
  isRead: boolean;
  type: 'PAYMENT' | 'SYSTEM' | 'PROMOTIONAL' | 'SECURITY';
  metadata?: Record<string, any>;
}

// Define the Notification schema
const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },
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
    type: {
      type: String,
      enum: ['PAYMENT', 'SYSTEM', 'PROMOTIONAL', 'SECURITY'],
      required: [true, 'Notification type is required'],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
NotificationSchema.index({ recipientId: 1, creationTime: -1 });
NotificationSchema.index({ recipientId: 1, isRead: 1 });

// Create or retrieve the Notification model
export const Notification = mongoose.models.Notification as mongoose.Model<INotification> || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification; 