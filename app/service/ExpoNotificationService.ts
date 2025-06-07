import User from '#models/user'
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk' 

export default class ExpoNotificationService {
  private expo = new Expo()

  async sendPushNotification(userId: number, title: string, body: string, data?: Record<string, unknown>) {
    try {
      const user = await User.findOrFail(userId)

      if (!user.notificationToken) {
        console.warn(`User ${userId} does not have a notification token.`)
        return
      }

      if (!Expo.isExpoPushToken(user.notificationToken)) {
        console.error(`User ${userId} has an invalid Expo push token: ${user.notificationToken}`)
        return
      }

      const message: ExpoPushMessage = {
        to: user.notificationToken,
        sound: 'default',
        title,
        body,
        data: data || {},
      }

      console.log(`Sending notification to token: ${user.notificationToken}`)
      const tickets: ExpoPushTicket[] = await this.expo.sendPushNotificationsAsync([message])
      console.log('Tickets received:', tickets)


      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
            const receiptId = ticket.id as ExpoPushReceiptId;
            console.log(`Notification ticket for token ${user.notificationToken} is OK, receipt ID: ${receiptId}`);
        } else if (ticket.status === 'error') {
          console.error(
            `Error sending notification to token ${user.notificationToken}: ${ticket.message}`
          )
          if (ticket.details && ticket.details.error) {
            console.error(`Error details: ${ticket.details.error}`)
            if (ticket.details.error === 'DeviceNotRegistered') {
              user.notificationToken = null
              await user.save()
              console.log(`Token ${message.to} marked as invalid and removed for user ${userId}.`)
            }
          }
        }
      }

    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        console.error(`User with ID ${userId} not found for sending notification.`)
      } else {
        console.error(`Failed to send push notification to user ${userId}:`, error)
      }
    }
  }

  async checkPushNotificationReceipts(receiptIds: ExpoPushReceiptId[]) {
    if (receiptIds.length === 0) {
        console.log("No receipt IDs to check.");
        return;
    }
    console.log("Checking receipts for IDs:", receiptIds);

    try {
        const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);
        for (const chunk of receiptIdChunks) {
            try {
                const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
                console.log("Receipts received:", receipts);

                for (const receiptId in receipts) {
                    const receipt = receipts[receiptId];
                    if (receipt.status === 'ok') {
                        console.log(`Notification with receipt ID ${receiptId} delivered.`);
                    } else if (receipt.status === 'error') {
                        console.error(`Notification with receipt ID ${receiptId} failed: ${receipt.message}`);
                        if (receipt.details && receipt.details.error) {
                            console.error(`Error details: ${receipt.details.error}`);
                                                        if (receipt.details.error === 'DeviceNotRegistered') {
                                console.warn(`Receipt ${receiptId} indicates DeviceNotRegistered. Token should be invalidated.`);                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error getting push notification receipts for a chunk:', error);
            }
        }
    } catch (error) {
        console.error('Error chunking push notification receipt IDs:', error);
    }
  }

}