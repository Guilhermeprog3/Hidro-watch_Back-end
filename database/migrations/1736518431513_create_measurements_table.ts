import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'measurements'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.timestamp('timestamp').notNullable()
      table.decimal('ph').notNullable()
      table.decimal('turbidity').notNullable()
      table.decimal('temperature').notNullable()
      table.decimal('tds').notNullable()
      table
        .integer('device_id')
        .notNullable()
        .unsigned()
        .references('id')
        .inTable('device')
        .onUpdate('CASCADE')
        .onDelete('CASCADE')
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
