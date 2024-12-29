import vine from '@vinejs/vine'

export const createObjectValidator = vine.compile(
  vine.object({
    tittle: vine.string().trim(),
    location: vine.string().trim(),
  })
)

export const updateObjetcValidator = vine.compile(
  vine.object({
    tittle: vine.string().trim().optional(),
    location: vine.string().trim().optional(),
    favorite: vine.boolean().optional(),
  })
)
