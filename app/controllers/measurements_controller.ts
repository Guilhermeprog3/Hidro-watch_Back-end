import type { HttpContext } from '@adonisjs/core/http'
import Measurement from '#models/measurement'
import Device from '#models/device'
import User from '#models/user'
import { createMeasurementValidator, updateMeasurementValidator } from '#validators/measurement'
import { DateTime } from 'luxon'
import ExpoNotificationService from '../service/ExpoNotificationService.js'

export default class MeasurementsController {
  private notificationService = new ExpoNotificationService()

  async index({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const device = await Device.query()
        .where('id', params.device_id)
        .where((query) => {
          query
            .where('user_id', user.id)
            .orWhereHas('users', (userQuery) => {
              userQuery.where('user_id', user.id)
            })
        })
        .preload('measurements', (measurementQuery) => {
           measurementQuery.orderBy('created_at', 'desc')
        })
        .firstOrFail()
      return device.measurements

    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(403).json({
          error: 'Você não tem permissão para acessar este dispositivo ou ele não existe.',
        })
      }
      return response.status(500).json({
        error: 'Ocorreu um erro ao buscar as medições do dispositivo.',
      })
    }
  }

  async store({ request, params, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createMeasurementValidator)
      const device = await Device.query().where('id', params.device_id).preload('users').firstOrFail()

      const measurement = await device.related('measurements').create({
        ...payload,
        timestamp: DateTime.local(),
      })

      for (const user of device.users) {
        await this.checkWaterQuality(
          user,
          payload.ph,
          payload.turbidity,
          payload.temperature,
          payload.tds
        )
      }

      const owner = await User.findOrFail(device.userId)
      if (!device.users.some((u) => u.id === owner.id)) {
        await this.checkWaterQuality(
          owner,
          payload.ph,
          payload.turbidity,
          payload.temperature,
          payload.tds
        )
      }

      return response.status(201).json(measurement)
    } catch (error) {
      console.error(error)
      return response.status(400).json({
        error: 'Erro ao criar medição',
        details: error.messages?.errors || error.message,
      })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const device = await Device.findOrFail(params.device_id)

      const measurement = await Measurement.query()
        .where('id', params.id)
        .andWhere('device_id', device.id)
        .firstOrFail()
      return response.status(200).json(measurement)
    } catch (error) {
      return response.status(404).json({
        error: 'Measurement not found or does not belong to the specified device.',
      })
    }
  }

  async update({ request, params, response }: HttpContext) {
    try {
      const measurement = await Measurement.findByOrFail('id', params.id)
      const payload = await request.validateUsing(updateMeasurementValidator)

      measurement.merge(payload)
      await measurement.save()

      return response.status(200).json(measurement)
    } catch (error) {
      response.status(400).json({ error: 'Measurement not found' })
    }
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const measurement = await Measurement.findByOrFail('id', params.id)
      await measurement.delete()
      return response.status(203)
    } catch (error) {
      return response.status(404).json({
        error: 'Measurement not found.',
      })
    }
  }
  async weeklyAverage({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!

      const device = await Device.query()
        .where('id', params.device_id)
        .where((query) => {
          query
            .where('user_id', user.id)
            .orWhereHas('users', (userQuery) => {
              userQuery.where('user_id', user.id)
            })
        })
        .firstOrFail()

      const today = DateTime.local()
      const startDate = today.minus({ days: 6 }).startOf('day')

      const measurements = await Measurement.query()
        .where('device_id', device.id)
        .where('timestamp', '>=', startDate.toISO())

      const dailySums = new Map<string, {
        ph: number
        turbidity: number
        temperature: number
        tds: number
        count: number
      }>()

      measurements.forEach((measurement) => {
        const dateKey = measurement.timestamp.toISODate()
        if (dateKey) {
          let dayData = dailySums.get(dateKey)
          if (!dayData) {
            dayData = { ph: 0, turbidity: 0, temperature: 0, tds: 0, count: 0 }
            dailySums.set(dateKey, dayData)
          }
          dayData.ph += Number(measurement.ph)
          dayData.turbidity += Number(measurement.turbidity)
          dayData.temperature += Number(measurement.temperature)
          dayData.tds += Number(measurement.tds)
          dayData.count++
        }
      })

      const weeklyAverages = Array.from({ length: 7 }, (_, i) => {
        const date = startDate.plus({ days: i })
        const dateKey = date.toISODate()
        const sums = dateKey ? dailySums.get(dateKey) : null

        return {
          day: date.toFormat('EEE'),
          date: dateKey,
          ph: sums && sums.count > 0 ? sums.ph / sums.count : 0,
          turbidity: sums && sums.count > 0 ? sums.turbidity / sums.count : 0,
          temperature: sums && sums.count > 0 ? sums.temperature / sums.count : 0,
          tds: sums && sums.count > 0 ? sums.tds / sums.count : 0,
        }
      })

      return response.status(200).json(weeklyAverages)
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(403).json({
          error: 'Você não tem permissão para acessar este dispositivo ou ele não existe.',
        })
      }
      console.error(error)
      return response.status(500).json({ error: 'Ocorreu um erro ao buscar a média semanal.' })
    }
  }
  async getLatestMeasurement({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!

      const device = await Device.query()
        .where('id', params.device_id)
        .where((query) => {
          query
            .where('user_id', user.id)
            .orWhereHas('users', (userQuery) => {
              userQuery.where('user_id', user.id)
            })
        })
        .firstOrFail()
      const latestMeasurement = await Measurement.query()
        .where('device_id', device.id)
        .orderBy('timestamp', 'desc')
        .first()

      if (!latestMeasurement) {
        return response.status(404).json({
          error: 'Nenhuma medição encontrada para este dispositivo.',
        })
      }

      return response.status(200).json(latestMeasurement)
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.status(403).json({
          error: 'Você não tem permissão para acessar este dispositivo ou ele não existe.',
        })
      }
      console.error(error)
      return response.status(500).json({
        error: 'Ocorreu um erro ao buscar a última medição.',
      })
    }
  }

 async checkWaterQuality(
    user: User,
    ph?: number | undefined,
    turbidity?: number | undefined,
    temperature?: number | undefined,
    tds?: number | undefined
  ) {
    if (
      ph === undefined ||
      turbidity === undefined ||
      temperature === undefined ||
      tds === undefined
    ) {
      console.warn('Parâmetros de qualidade da água incompletos')
      return
    }

    const STANDARDS = {
      PH: { min: 6.5, max: 8.5 },
      TURBIDITY: { max: 5.0 },
      TEMPERATURE: { min: 10, max: 30 },
      TDS: { max: 500 },
    }

    const alerts = [
      ph < STANDARDS.PH.min && `pH baixo (${ph.toFixed(1)} < ${STANDARDS.PH.min})`,
      ph > STANDARDS.PH.max && `pH alto (${ph.toFixed(1)} > ${STANDARDS.PH.max})`,
      turbidity > STANDARDS.TURBIDITY.max &&
        `Turbidez alta (${turbidity.toFixed(1)} > ${STANDARDS.TURBIDITY.max})`,
      temperature < STANDARDS.TEMPERATURE.min &&
        `Temperatura baixa (${temperature.toFixed(1)}°C < ${STANDARDS.TEMPERATURE.min}°C)`,
      temperature > STANDARDS.TEMPERATURE.max &&
        `Temperatura alta (${temperature.toFixed(1)}°C > ${STANDARDS.TEMPERATURE.max}°C)`,
      tds > STANDARDS.TDS.max && `TDS alto (${tds.toFixed(1)} > ${STANDARDS.TDS.max})`,
    ].filter(Boolean)

    if (alerts.length > 0 && user.notificationToken) {
      const title = '⚠️ Alerta de Qualidade da Água'
      const message = alerts.join('\n• ')
      const data = {
        type: 'water_alert',
        values: { ph, turbidity, temperature, tds },
      }

      try {
        await this.notificationService.sendToToken(user.notificationToken, title, message, data)
        console.log(`Notificação enviada para usuário ${user.id}`)
      } catch (error) {
        console.error(`Falha ao enviar notificação para usuário ${user.id}:`, error)
      }
    }
  }
}