/**
 * Push Notification Utility
 * 
 * Simple utility for sending push notifications using Expo's push notification service.
 * This is a wrapper around the NotificationService that makes it easy to send
 * push notifications from anywhere in the application.
 */

import { NotificationService } from './notificationService';

/**
 * Send a push notification to a device with an Expo push token
 * 
 * @param pushToken - The Expo push token of the recipient device
 * @param title - The notification title
 * @param body - The notification body text
 * @param data - Optional additional data to include with the notification
 * @returns Promise<boolean> - true if successful, false otherwise
 * 
 * @example
 * // Basic usage
 * await sendPushNotification('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]', 'Hello', 'This is a test notification');
 * 
 * // With custom data
 * await sendPushNotification(
 *   'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
 *   'New Payment',
 *   'You received $50.00 from John Doe',
 *   {
 *     type: 'PAYMENT',
 *     transactionId: '123456789',
 *     amount: 50.00,
 *     sender: 'John Doe'
 *   }
 * );
 */
export async function sendPushNotification(
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<boolean> {
  return NotificationService.sendPushNotification(pushToken, title, body, data);
}

/**
 * Send push notifications to multiple devices
 * 
 * @param pushTokens - Array of Expo push tokens
 * @param title - The notification title
 * @param body - The notification body text
 * @param data - Optional additional data to include with the notification
 * @returns Promise<{success: string[], failed: string[]}> - Arrays of successful and failed tokens
 */
export async function sendBulkPushNotifications(
  pushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{success: string[], failed: string[]}> {
  const results = await Promise.all(
    pushTokens.map(async (token) => {
      const success = await NotificationService.sendPushNotification(token, title, body, data);
      return { token, success };
    })
  );
  
  return {
    success: results.filter(r => r.success).map(r => r.token),
    failed: results.filter(r => !r.success).map(r => r.token)
  };
} 