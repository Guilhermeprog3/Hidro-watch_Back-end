import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import type Measurement from './measurement.js'

let MeasurementModel: typeof import('./measurement.js').default

export default class Device extends BaseModel {
  public static table = 'device'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare location: string

  @column()
  declare favorite: boolean

  @column()
  declare userId: number

  @column()
  declare connected: boolean

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'user_devices',
  })
  declare users: ManyToMany<typeof User>

  @hasMany(() => MeasurementModel, {
    foreignKey: 'deviceId',
  })
  declare measurements: HasMany<typeof Measurement>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

import('./measurement.js').then((m) => {
  MeasurementModel = m.default
})