
import type { HttpContext } from '@adonisjs/core/http'
import Device from '#models/device'
import { createDeviceValidator, updateDeviceValidator } from '#validators/device'
export default class DeviceController {
  
  async index({ auth }: HttpContext) {
    const user = auth.user!

    const devices = await Device.query()
      .where('user_id', user.id)
      .orWhereHas('users', (query) => {
        query.where('user_id', user.id)
      })
      .preload('user')

    return devices
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
  async associateUser({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const device = await Device.findOrFail(params.id)

      const isAlreadyAssociated = await device
        .related('users')
        .query()
        .where('user_id', user.id)
        .first()

      if (isAlreadyAssociated) {
        return response
          .status(409)
          .json({ message: 'Você já está conectado a este dispositivo.' })
      }

      await device.related('users').attach([user.id])

      return response.ok({ message: 'Você foi conectado ao dispositivo com sucesso!' })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Dispositivo não encontrado.' })
      }

      console.error('Falha ao associar dispositivo:', error)
      return response.internalServerError({ message: 'Ocorreu um erro ao conectar ao dispositivo.' })
    }
  }
  async leaveDevice({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const device = await Device.findOrFail(params.id)
      if (device.userId === user.id) {
        return response.status(403).json({
          message: 'Você é o dono deste dispositivo e não pode se desassociar. Considere apagar ou transferir o dispositivo.',
        })
      }

      await device.related('users').detach([user.id])

      return response.ok({ message: 'Você saiu do dispositivo com sucesso!' })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(404).json({ message: 'Dispositivo não encontrado.' })
      }
      console.error('Falha ao sair do dispositivo:', error)
      return response
        .internalServerError({ message: 'Ocorreu um erro ao tentar sair do dispositivo.' })
    }
  }
}
