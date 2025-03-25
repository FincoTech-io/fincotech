import { NotificationService, NotificationPayload } from './notificationService';
import { IUser } from '../models/User';
import { Expo } from 'expo-server-sdk';

/**
 * Helper functions to create notifications for various system events
 */
export const NotificationTriggers = {
  /**
   * Trigger a notification when a payment is sent
   */
  paymentSent: async (
    user: IUser, 
    amount: number, 
    currency: string, 
    recipientName: string
  ) => {
    const notification: NotificationPayload = {
      title: 'Payment Sent',
      message: `Your payment of ${amount} ${currency} to ${recipientName} was successful.`,
      type: 'UPDATE',
      recipientId: user._id.toString(),
      metadata: {
        direction: 'sent',
        amount,
        currency,
        recipientName,
      },
    };

    return NotificationService.processNotification(notification);
  },

  /**
   * Trigger a notification when a payment is received
   */
  paymentReceived: async (
    user: IUser, 
    amount: number, 
    currency: string, 
    senderName: string
  ) => {
    const notification: NotificationPayload = {
      title: 'Payment Received',
      message: `You received ${amount} ${currency} from ${senderName}.`,
      type: 'UPDATE',
      recipientId: user._id.toString(),
      metadata: {
        direction: 'received',
        amount,
        currency,
        senderName,
      },
    };

    return NotificationService.processNotification(notification);
  },

  /**
   * Trigger a notification for account security events
   */
  securityAlert: async (
    user: IUser,
    alertType: 'login' | 'password_change' | 'profile_update' | 'suspicious_activity',
    deviceInfo?: string,
    location?: string
  ) => {
    let title: string;
    let message: string;

    switch (alertType) {
      case 'login':
        title = 'New Login Detected';
        message = `A new login to your account was detected${deviceInfo ? ` from ${deviceInfo}` : ''}${location ? ` in ${location}` : ''}.`;
        break;
      case 'password_change':
        title = 'Password Changed';
        message = 'Your account password was recently changed.';
        break;
      case 'profile_update':
        title = 'Profile Updated';
        message = 'Your account profile information was updated.';
        break;
      case 'suspicious_activity':
        title = 'Suspicious Activity';
        message = `Unusual activity was detected on your account${location ? ` from ${location}` : ''}.`;
        break;
      default:
        title = 'Security Alert';
        message = 'There was a security event on your account.';
    }

    const notification: NotificationPayload = {
      title,
      message,
      type: 'SECURITY',
      recipientId: user._id.toString(),
      metadata: {
        alertType,
        deviceInfo,
        location,
      },
    };

    return NotificationService.processNotification(notification);
  },

  /**
   * Trigger a notification for system updates
   */
  systemUpdate: async (
    user: IUser,
    updateType: 'maintenance' | 'new_feature' | 'service_disruption' | 'app_update',
    details: string
  ) => {
    let title: string;
    
    switch (updateType) {
      case 'maintenance':
        title = 'Scheduled Maintenance';
        break;
      case 'new_feature':
        title = 'New Feature Available';
        break;
      case 'service_disruption':
        title = 'Service Disruption';
        break;
      case 'app_update':
        title = 'App Update Available';
        break;
      default:
        title = 'System Update';
    }

    const notification: NotificationPayload = {
      title,
      message: details,
      type: 'SYSTEM',
      recipientId: user._id.toString(),
      metadata: {
        updateType,
      },
    };

    return NotificationService.processNotification(notification);
  },

  /**
   * Trigger a promotional notification
   */
  promotion: async (
    user: IUser,
    title: string,
    details: string,
    promoCode?: string,
    expiryDate?: Date
  ) => {
    const notification: NotificationPayload = {
      title,
      message: details,
      type: 'PROMOTIONAL',
      recipientId: user._id.toString(),
      metadata: {
        promoCode,
        expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
      },
    };

    return NotificationService.processNotification(notification);
  },

  /**
   * Send a custom notification
   */
  custom: async (
    user: IUser,
    title: string,
    message: string,
    type: 'UPDATE' | 'SYSTEM' | 'PROMOTIONAL' | 'SECURITY',
    metadata?: Record<string, any>
  ) => {
    const notification: NotificationPayload = {
      title,
      message,
      type,
      recipientId: user._id.toString(),
      metadata,
    };

    return NotificationService.processNotification(notification);
  },
};

export default NotificationTriggers; 