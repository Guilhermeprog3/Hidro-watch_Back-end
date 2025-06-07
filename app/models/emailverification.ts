import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class EmailVerification extends BaseModel {

  public static table = 'email_verifications'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare code: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
