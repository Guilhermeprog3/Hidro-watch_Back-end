// app/services/ExpoNotificationService.ts
import User from '#models/user'
import { Expo } from 'expo-server-sdk'

export default class ExpoNotificationService {
  private expo = new Expo() 

  async sendPushNotification(userId: number, title: string, body: string) {
    const user = await User.findOrFail(userId)
    
    if (!user.token_not) return

    await this.expo.sendPushNotificationsAsync([{
      to: user.token_not,
      sound: 'default',
      title,
      body
    }])
  }
}