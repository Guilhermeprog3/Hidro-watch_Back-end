import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type Device from './device.js'

let DeviceModel: typeof import('./device.js').default

export default class Measurement extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime({ autoCreate: true })
  declare timestamp: DateTime

  @column()
  declare ph: number

  @column()
  declare turbidity: number

  @column()
  declare temperature: number

  @column()
  declare tds: number

  @column({ columnName: 'device_id' })
  declare deviceId: number

  @belongsTo(() => DeviceModel, {
    foreignKey: 'deviceId',
  })
  declare device: BelongsTo<typeof Device>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}

import('./device.js').then((m) => {
  DeviceModel = m.default
})
