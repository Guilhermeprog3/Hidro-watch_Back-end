import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import { type BelongsTo } from '@adonisjs/lucid/types/relations'
import Object from './object.js'

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

  @column({ serializeAs: 'averageMeasurement' })
  declare average_measurement: number

  @column({ columnName: 'object_id' })
  declare objectId: number

  @belongsTo(() => Object)
  declare object: BelongsTo<typeof Object>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}