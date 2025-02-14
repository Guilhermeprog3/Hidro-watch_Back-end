import vine from '@vinejs/vine'

export const createMeasurementValidator = vine.compile(
  vine.object({
    ph: vine.number(),
    turbidity: vine.number(),
    temperature: vine.number(),
  })
)

export const updateMeasurementValidator = vine.compile(
  vine.object({
    ph: vine.number().optional(),
    turbidity: vine.number().optional(),
    temperature: vine.number().optional(),
  })
)
