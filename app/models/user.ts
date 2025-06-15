import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import { type HasMany } from '@adonisjs/lucid/types/relations'
import Device from './device.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})
export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare token: string | null

  @column()
  declare notificationToken: string | null

  @column()
  public reset_code?: string

  @column({
    consume: (value) => value ? value.trim() : null,
    serialize: (value) => value ? value.trim() : null
  })
  declare profile_picture: string | null

  @column.dateTime()
  public reset_expires_at?: DateTime

  @hasMany(() => Device)
  declare device: HasMany<typeof Device>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)

  public serializeExtras() {
    return {
      ...this.serializeAttributes(),
      ...this.serializeComputed(),
      profile_picture: this.profile_picture?.trim() || null
    }
  }
}