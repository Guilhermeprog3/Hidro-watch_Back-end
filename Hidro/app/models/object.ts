import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import { type HasMany } from '@adonisjs/lucid/types/relations'
import Measurement from './measurement.js'

export default class Objects extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tittle: string

  @column()
  declare location: string

  @column()
  declare favorite: boolean

  @column()
  declare userId: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => Measurement, {
    foreignKey: 'objectId',
  })
  declare measurements: HasMany<typeof Measurement>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
