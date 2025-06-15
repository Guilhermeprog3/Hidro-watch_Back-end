
import type { HttpContext } from '@adonisjs/core/http'
import Device from '#models/device'
import { createDeviceValidator, updateDeviceValidator } from '#validators/device'
export default class DeviceController {
  
  async index({ auth }: HttpContext) {
    const user = auth.user!
    await user.load('device', (query) => {
      query.orderBy('created_at', 'desc')
    })
    return user.device
  }

  async store({ request, auth, response }: HttpContext) {
    try {
      const { title, location } = await request.validateUsing(createDeviceValidator)
      const user = auth.user!
      await user.related('device').create({
        title,
        location,
      })
      return {
        title,
        location,
      }
    } catch (error) {
      response.status(400).json({ error: 'erro' })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const device = await Device.findByOrFail('id', params.id)
      return device
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }
  async update({ request, params, response }: HttpContext) {
    try {
      const device = await Device.findByOrFail('id', params.id)
      const { title, location } = await request.validateUsing(updateDeviceValidator)
      device.merge({ title, location })
      await device.save()
      return device
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }
  async edit({ params, response }: HttpContext) {
    try {
      const device = await Device.findByOrFail('id', params.id)
      device.favorite = !device.favorite
      await device.save()
      return device
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }
  async destroy({ params, response }: HttpContext) {
    try {
      const device = await Device.findByOrFail('id', params.id)
      await device.delete()
      return response.status(203)
    } catch (error) {
      response.status(400).json({ error: 'Device not found' })
    }
  }

  async toggleConnected({ params, response }: HttpContext) {
    try {
      const device = await Device.findByOrFail('id', params.id)
      device.connected = !device.connected
      await device.save()
      return device
    } catch (error) {
      return response.status(404).json({ error: 'Device not found' })
    }
  }
}
