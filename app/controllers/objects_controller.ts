import { createObjectValidator } from '#validators/object'
import type { HttpContext } from '@adonisjs/core/http'
import { updateObjetcValidator } from '#validators/object'
import Device from '#models/device'
export default class ObjectsController {
  
  async index({ auth }: HttpContext) {
    const user = auth.user!
    await user.load('objects', (query) => {
      query.orderBy('created_at', 'desc')
    })
    return user.devices
  }

  async store({ request, auth, response }: HttpContext) {
    try {
      const { tittle, location } = await request.validateUsing(createObjectValidator)
      const user = auth.user!
      await user.related('devices').create({
        tittle,
        location,
      })
      return {
        tittle,
        location,
      }
    } catch (error) {
      response.status(400).json({ error: 'erro' })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const object = await Device.findByOrFail('id', params.id)
      return object
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }
  async update({ request, params, response }: HttpContext) {
    try {
      const object = await Device.findByOrFail('id', params.id)
      const { tittle, location } = await request.validateUsing(updateObjetcValidator)
      object.merge({ tittle, location })
      await object.save()
      return object
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }
  async edit({ params, response }: HttpContext) {
    try {
      const object = await Device.findByOrFail('id', params.id)
      object.favorite = !object.favorite
      await object.save()
      return object
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }
  async destroy({ params, response }: HttpContext) {
    try {
      const object = await Device.findByOrFail('id', params.id)
      await object.delete()
      return response.status(203)
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }

  async toggleConnected({ params, response }: HttpContext) {
    try {
      const object = await Device.findByOrFail('id', params.id)
      object.connected = !object.connected
      await object.save()
      return object
    } catch (error) {
      return response.status(404).json({ error: 'Device not found' })
    }
  }
}
