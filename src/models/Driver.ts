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
export interface IDriver extends Document {
  _id: string;
  phoneNumber: string;
  hasUnreadNotifications: boolean;
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
const DriverSchema = new Schema<IDriver>(
  {

  },
  {
    timestamps: true,
  }
);

// Create or retrieve the User model
export const Driver = mongoose.models.Driver as mongoose.Model<IDriver> || 
  mongoose.model<IDriver>('Driver', DriverSchema);

export default Driver; 