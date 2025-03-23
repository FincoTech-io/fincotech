import { INotification, Notification } from '../models/Notification';
import { IUser, User } from '../models/User';
import mongoose from 'mongoose';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';

// Initialize Twilio client (will need to add Twilio credentials to .env)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// Email transporter configuration (will need to add email service credentials to .env)
const emailTransporter = process.env.EMAIL_SERVICE && process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

// Initialize Expo SDK client
const expo = new Expo();

export interface NotificationPayload {
  title: string;
  message: string;
  type: 'PAYMENT' | 'SYSTEM' | 'PROMOTIONAL' | 'SECURITY';
  recipientId: string;
  metadata?: Record<string, any>;
}

export class NotificationService {

  /** 
   * Register a device for push notifications
   */
  static async registerUserDevice(pushToken: string, userId: string): Promise<boolean> {
    try {

      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found');
        return false;
      }

      // Check if pushToken is the same as the one already registered
      if (user.pushToken === pushToken) {
        console.log('🔍 Device already registered');
        return true;
      }

      // Register the device
      await User.findByIdAndUpdate(userId, { pushToken });
      return true;
    } catch (error) {
      console.error('Error registering device:', error);
      return false;
    }
  }

  /**
   * Create a new notification for a user
   */
  static async createNotification(notificationData: NotificationPayload): Promise<INotification> {
    try {
      // Create notification in database
      const notification = await Notification.create({
        ...notificationData,
        recipientId: new mongoose.Types.ObjectId(notificationData.recipientId),
        creationTime: new Date(),
        isRead: false,
      });

      // Update user to indicate they have unread notifications
      await User.findByIdAndUpdate(
        notificationData.recipientId,
        { hasUnreadNotifications: true }
      );

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user
   */
  static async getUserNotifications(userId: string, { limit = 20, offset = 0, includeRead = false } = {}): Promise<{
    notifications: INotification[];
    totalCount: number;
    unreadCount: number;
  }> {
    try {
      const query: any = { recipientId: new mongoose.Types.ObjectId(userId) };
      
      if (!includeRead) {
        query.isRead = false;
      }

      // Get total notification count and unread count
      const [totalCount, unreadCount] = await Promise.all([
        Notification.countDocuments({ recipientId: new mongoose.Types.ObjectId(userId) }),
        Notification.countDocuments({ recipientId: new mongoose.Types.ObjectId(userId), isRead: false }),
      ]);

      // Get notifications with pagination
      const notifications = await Notification.find(query)
        .sort({ creationTime: -1 })
        .skip(offset)
        .limit(limit);

      return { notifications, totalCount, unreadCount };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notifications as read
   */
  static async markNotificationsAsRead(userId: string, notificationIds?: string[]): Promise<void> {
    try {
      const updateQuery: any = { recipientId: new mongoose.Types.ObjectId(userId) };
      
      // If specific notification IDs are provided, only mark those as read
      if (notificationIds && notificationIds.length > 0) {
        updateQuery._id = { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) };
      }

      await Notification.updateMany(updateQuery, { isRead: true });

      // Check if user has any unread notifications left
      const unreadCount = await Notification.countDocuments({ 
        recipientId: new mongoose.Types.ObjectId(userId), 
        isRead: false 
      });

      // Update user's hasUnreadNotifications flag if needed
      if (unreadCount === 0) {
        await User.findByIdAndUpdate(userId, { hasUnreadNotifications: false });
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete notifications
   */
  static async deleteNotifications(userId: string, notificationIds: string[]): Promise<void> {
    try {
      await Notification.deleteMany({
        recipientId: new mongoose.Types.ObjectId(userId),
        _id: { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) }
      });

      // Check if user has any unread notifications left
      const unreadCount = await Notification.countDocuments({ 
        recipientId: new mongoose.Types.ObjectId(userId), 
        isRead: false 
      });

      // Update user's hasUnreadNotifications flag if needed
      if (unreadCount === 0) {
        await User.findByIdAndUpdate(userId, { hasUnreadNotifications: false });
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
      throw error;
    }
  }

  /**
   * Send SMS notification
   */
  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      if (!twilioClient) {
        console.error('Twilio client not initialized');
        return false;
      }

      await twilioClient.messages.create({
        body: message,
        to: phoneNumber,
        from: process.env.TWILIO_PHONE_NUMBER,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  /**
   * Send email notification
   */
  static async sendEmail(email: string, subject: string, message: string): Promise<boolean> {
    try {
      if (!emailTransporter) {
        console.error('Email transporter not initialized');
        return false;
      }

      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'noreply@fincotech.com',
        to: email,
        subject,
        text: message,
        html: `<div>${message}</div>`,
      });
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send push notification using Expo
   */
  static async sendPushNotification(pushToken: string, title: string, body: string, data?: any): Promise<boolean> {
    try {
      // Validate that the push token is a valid Expo push token
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        return false;
      }

      // Create a message object
      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
      };

      // Create a chunk of one message
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      // Send the chunks to the Expo push notification service
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Error sending push notification chunk:', error);
        }
      }

      // Process the tickets
      for (const ticket of tickets) {
        if (ticket.status === 'error') {
          console.error(`Push notification error: ${ticket.message}`);
          if (ticket.details && ticket.details.error) {
            console.error(`Error details: ${ticket.details.error}`);
          }
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Create bulk notifications for multiple users
   */
  static async createBulkNotifications(
    recipientIds: string[], 
    notificationData: Omit<NotificationPayload, 'recipientId'>
  ): Promise<number> {
    try {
      const notifications = recipientIds.map(recipientId => ({
        ...notificationData,
        recipientId: new mongoose.Types.ObjectId(recipientId),
        creationTime: new Date(),
        isRead: false,
      }));
      
      const result = await Notification.insertMany(notifications);
      
      // Update users to indicate they have unread notifications
      await User.updateMany(
        { _id: { $in: recipientIds.map(id => new mongoose.Types.ObjectId(id)) } },
        { hasUnreadNotifications: true }
      );
      
      return result.length;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Process notification according to user preferences
   */
  static async processNotification(notification: NotificationPayload): Promise<{
    notification: INotification;
    channels: {
      inApp: boolean;
      sms: boolean;
      email: boolean;
      push: boolean;
    };
  }> {
    try {
      // Save notification to database
      const savedNotification = await this.createNotification(notification);
      
      // Get user to check their notification preferences
      const user = await User.findById(notification.recipientId);
      if (!user) {
        throw new Error(`User not found: ${notification.recipientId}`);
      }

      const channels = {
        inApp: true, // In-app notifications are always enabled
        sms: false,
        email: false,
        push: false,
      };

      // Determine which preference category to use based on notification type
      let preferenceCategory: keyof typeof user.notificationPreferences;
      
      switch(notification.type) {
        case 'PAYMENT':
          // Determine if it's a payment received or sent based on metadata
          if (notification.metadata?.direction === 'received') {
            preferenceCategory = 'paymentReceived';
          } else {
            preferenceCategory = 'paymentSent';
          }
          break;
        case 'SYSTEM':
          preferenceCategory = 'systemUpdates';
          break;
        case 'SECURITY':
          preferenceCategory = 'security';
          break;
        case 'PROMOTIONAL':
          preferenceCategory = 'promotions';
          break;
        default:
          preferenceCategory = 'systemUpdates';
      }

      // Check user preferences and send notifications accordingly
      const preferences = user.notificationPreferences[preferenceCategory];

      // Send SMS if enabled
      if (preferences.sms) {
        channels.sms = await this.sendSMS(user.phoneNumber, `${notification.title}: ${notification.message}`);
      }

      // Send email if enabled
      if (preferences.email) {
        channels.email = await this.sendEmail(user.email, notification.title, notification.message);
      }

      // Send push notification if enabled and push token exists
      if (preferences.push && user.pushToken) {
        channels.push = await this.sendPushNotification(
          user.pushToken,
          notification.title,
          notification.message,
          {
            type: notification.type,
            notificationId: savedNotification._id.toString(),
            ...notification.metadata
          }
        );
      }

      return { notification: savedNotification, channels };
    } catch (error) {
      console.error('Error processing notification:', error);
      throw error;
    }
  }
}

export default NotificationService; 