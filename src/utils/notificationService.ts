import { IEmbeddedNotification, IUser, User } from '../models/User';
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
  type: 'UPDATE' | 'SYSTEM' | 'PROMOTIONAL' | 'SECURITY';
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
  static async createNotification(notificationData: NotificationPayload): Promise<IEmbeddedNotification> {
    try {
      // Create notification object
      const notification: IEmbeddedNotification = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        creationTime: new Date(),
        isRead: false,
        pinned: false,
        metadata: notificationData.metadata || {},
      };

      // Find user and push notification directly to their notifications array
      const user = await User.findById(notificationData.recipientId);
      if (!user) {
        throw new Error(`User not found: ${notificationData.recipientId}`);
      }

      // Add notification to user's notifications array
      user.notifications.push(notification);
      
      // Set unread flag
      user.hasUnreadNotifications = true;
      
      // Save user with new notification
      await user.save();

      // Return the newly created notification (with _id assigned by MongoDB)
      return user.notifications[user.notifications.length - 1];
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for a user
   */
  static async getUserNotifications(userId: string): Promise<{
    notifications: IEmbeddedNotification[];
    totalCount: number;
    unreadCount: number;
  }> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      const notifications = user.notifications || [];
      const totalCount = notifications.length;
      const unreadCount = notifications.filter(n => !n.isRead).length;

      // sort notifications by creationTime
      notifications.sort((a, b) => b.creationTime.getTime() - a.creationTime.getTime());

      return { notifications, totalCount, unreadCount };
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  static async markNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Find the notification in the user's notifications array
      const notification = user.notifications.find(n => n._id?.toString() === notificationId);
      if (!notification) {
        return false;
      }

      // Update the notification
      notification.isRead = true;

      // Check if all notifications are read, and update hasUnreadNotifications accordingly
      const hasUnread = user.notifications.some(n => !n.isRead);
      user.hasUnreadNotifications = hasUnread;
      
      await user.save();
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllNotificationsAsRead(userId: string): Promise<number> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Count unread notifications before update
      const unreadCount = user.notifications.filter(n => !n.isRead).length;

      // Mark all as read
      user.notifications.forEach(notification => {
        notification.isRead = true;
      });

      // Update hasUnreadNotifications flag
      user.hasUnreadNotifications = false;
      
      await user.save();
      
      return unreadCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(user: IUser, notificationId: string): Promise<boolean> {
    try {
      // Find notification index
      const notificationIndex = user.notifications.findIndex(
        n => n._id?.toString() === notificationId
      );

      if (notificationIndex === -1) {
        return false;
      }

      // Remove the notification from the array
      user.notifications.splice(notificationIndex, 1);
      
      // Update hasUnreadNotifications flag
      user.hasUnreadNotifications = user.notifications.some(n => !n.isRead);
      
      await user.save();
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Delete all notifications for a user
   */
  static async deleteAllNotifications(user: IUser) {
    try {
      // Clear the notifications array
      user.notifications = [];
      
      // Update hasUnreadNotifications flag
      user.hasUnreadNotifications = false;
      
      await user.save();

    } catch (error) {
      console.error('Error deleting all notifications:', error);
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
      let successCount = 0;
      
      // Build the notification object without recipientId
      const baseNotification = {
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        creationTime: new Date(),
        isRead: false,
        pinned: false,
        metadata: notificationData.metadata || {},
      };
      
      // Update users to add the notification to each user's array
      const updatePromises = recipientIds.map(async (recipientId) => {
        try {
          const user = await User.findById(recipientId);
          if (user) {
            user.notifications.push(baseNotification);
            user.hasUnreadNotifications = true;
            await user.save();
            successCount++;
          }
        } catch (error) {
          console.error(`Error adding notification to user ${recipientId}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      
      return successCount;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Process notification according to user preferences
   */
  static async processNotification(notification: NotificationPayload): Promise<{
    notification: IEmbeddedNotification;
    channels: {
      inApp: boolean;
      sms: boolean;
      email: boolean;
      push: boolean;
    };
  }> {
    try {
      // Save notification to user's notifications array
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
        case 'UPDATE':
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
            notificationId: savedNotification._id?.toString(),
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