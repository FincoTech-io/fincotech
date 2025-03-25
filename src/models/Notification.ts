import mongoose, { Document, Schema } from 'mongoose';

// Interface for Notification document
export interface INotification extends Document {
  _id: string;
  title: string;
  message: string;
  creationTime: Date;
  isRead: boolean;
  type: 'UPDATE' | 'SYSTEM' | 'PROMOTIONAL' | 'SECURITY';
  pinned: boolean;
  metadata?: Record<string, any>;
}

// Define the Notification schema
const NotificationSchema = new Schema<INotification>(
  {
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
    },
  },
  {
    timestamps: true,
  }
);

// Create or retrieve the Notification model
export const Notification = mongoose.models.Notification as mongoose.Model<INotification> || 
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification; 