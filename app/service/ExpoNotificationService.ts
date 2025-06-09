import User from '#models/user'
import { Expo, ExpoPushMessage, ExpoPushTicket, ExpoPushReceiptId } from 'expo-server-sdk'
import { Exception } from '@adonisjs/core/exceptions'

export default class ExpoNotificationService {
  private expo = new Expo()

  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<ExpoPushTicket[] | null> {
    try {
      if (!token || typeof token !== 'string') {
        throw new Exception('Token de notificação inválido', { status: 400 })
      }

      if (!Expo.isExpoPushToken(token)) {
        throw new Exception(`Token Expo inválido: ${token}`, { status: 400 })
      }

      const message: ExpoPushMessage = {
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
        channelId: 'water-alerts',
      }

      console.log(`[Expo] Enviando notificação para token: ${token}`)
      const tickets = await this.expo.sendPushNotificationsAsync([message])
      console.log('[Expo] Tickets recebidos:', tickets)

      this.processTickets(tickets, token)
      return tickets
    } catch (error) {
      console.error('[Expo] Erro ao enviar notificação:', error)
      throw new Exception('Falha ao enviar notificação', { status: 500 })
    }
  }

  async sendToUser(
    userId: number,
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<boolean> {
    try {
      const user = await User.findOrFail(userId)

      if (!user.notificationToken) {
        console.warn(`[Expo] Usuário ${userId} não possui token de notificação`)
        return false
      }

      await this.sendToToken(user.notificationToken, title, body, data)
      return true
    } catch (error) {
      console.error(`[Expo] Erro ao enviar para usuário ${userId}:`, error)
      throw error
    }
  }

  private async processTickets(tickets: ExpoPushTicket[], originalToken: string) {
    const receiptIds: ExpoPushReceiptId[] = []

    for (const ticket of tickets) {
      if (ticket.status === 'ok') {
        const receiptId = ticket.id as ExpoPushReceiptId
        console.log(`[Expo] Ticket OK - ID: ${receiptId}`)
        receiptIds.push(receiptId)
      } else if (ticket.status === 'error') {
        console.error(
          `[Expo] Erro no ticket para token ${originalToken}: ${ticket.message}`
        )

        if (ticket.details?.error === 'DeviceNotRegistered') {
          await this.invalidateToken(originalToken)
        }
      }
    }

    if (receiptIds.length > 0) {
      setTimeout(() => this.checkReceipts(receiptIds), 15000)
    }
  }

  private async checkReceipts(receiptIds: ExpoPushReceiptId[]) {
    try {
      console.log('[Expo] Verificando receipts para IDs:', receiptIds)
      const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds)

      for (const chunk of receiptIdChunks) {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk)
        
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId]
          if (receipt.status === 'ok') {
            console.log(`[Expo] Notificação ${receiptId} entregue com sucesso`)
          } else if (receipt.status === 'error') {
            console.error(`[Expo] Erro no receipt ${receiptId}: ${receipt.message}`)
            
            if (receipt.details?.error === 'DeviceNotRegistered') {
              const ticket = await this.findTicketByReceiptId(receiptId)
              if (ticket?.token) {
                await this.invalidateToken(ticket.token)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[Expo] Erro ao verificar receipts:', error)
    }
  }

  private async invalidateToken(token: string) {
    try {
      await User.query()
        .where('notificationToken', token)
        .update({ notificationToken: null })
      
      console.log(`[Expo] Token ${token} marcado como inválido no banco de dados`)
    } catch (error) {
      console.error(`[Expo] Erro ao invalidar token ${token}:`, error)
    }
  }

  private async findTicketByReceiptId(_receiptId: string): Promise<{ token: string } | null> {
    return { token: '' }
  }
}