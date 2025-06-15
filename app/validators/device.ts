import vine from '@vinejs/vine'

export const createDeviceValidator = vine.compile(
  vine.object({
    title: vine.string().trim(),
    location: vine.string().trim(),
  })
)

export const updateDeviceValidator = vine.compile(
  vine.object({
    title: vine.string().trim().optional(),
    location: vine.string().trim().optional(),
    favorite: vine.boolean().optional(),
  })
)
