import type { HttpContext } from '@adonisjs/core/http'
import Measurement from '#models/measurement'
import Object from '#models/object'
import { createMeasurementValidator, updateMeasurementValidator } from '#validators/measurement'
import { DateTime } from 'luxon'
import ExpoNotificationService from '../service/ExpoNotificationService.js'
import User from '#models/user'

export default class MeasurementsController {
  private notificationService = new ExpoNotificationService()

  async index({ params, response }: HttpContext) {
    try {
      const object = await Object.findOrFail(params.object_id)
      await object.preload('measurements')
      return object.measurements
    } catch (error) {
      return response.status(404).json({
        error: 'Object not found or no associated measurements.',
      })
    }
  }

  async store({ request, params, response }: HttpContext) {
  try {
    const payload = await request.validateUsing(createMeasurementValidator)
    const object = await Object.findOrFail(params.object_id)
    
    const measurement = await object.related('measurements').create({
      ...payload,
      timestamp: DateTime.local(),
      average_measurement: (payload.ph + payload.turbidity + payload.tds) / 3,
    })

    await this.checkWaterQuality(
      object.userId,
      payload.ph,
      payload.turbidity,
      payload.temperature,
      payload.tds
    )

    return response.status(201).json(measurement)
  } catch (error) {
    console.error(error)
    return response.status(400).json({ 
      error: 'Erro ao criar medição',
      details: error.messages?.errors || error.message
    })
  }
}

  async show({ params, response }: HttpContext) {
    try {
      const object = await Object.findOrFail(params.object_id);

      const measurement = await Measurement.query()
        .where('id', params.id)
        .andWhere('object_id', object.id)
        .firstOrFail();
      return response.status(200).json(measurement);
    } catch (error) {
      return response.status(404).json({
        error: 'Measurement not found or does not belong to the specified object.',
      });
    }
  }

  async update({ request, params, response }: HttpContext) {
    try {
      const measurement = await Measurement.findByOrFail('id', params.id)
      const { ph, turbidity, temperature, tds } = await request.validateUsing(updateMeasurementValidator)

      measurement.merge({ ph, turbidity, temperature, tds })
      await measurement.save()

      const object = await Object.findOrFail(measurement.objectId)
      await this.checkWaterQuality(object.userId, ph, turbidity, temperature, tds)

      return response.status(200).json(measurement)
    } catch (error) {
      response.status(400).json({ error: 'Object not found' })
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

  async weeklyAverage({ params, response }: HttpContext) {
    try {
      const object = await Object.findOrFail(params.object_id)
      const today = DateTime.local()
      const startDate = today.minus({ days: 6 }).startOf('day')

      const measurements = await Measurement.query()
        .where('object_id', object.id)
        .where('timestamp', '>=', startDate.toISO())

      // Agrupa as medições por dia para calcular a soma e a contagem
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
          dayData.ph += measurement.ph
          dayData.turbidity += measurement.turbidity
          dayData.temperature += measurement.temperature
          dayData.tds += measurement.tds
          dayData.count++
        }
      })

      // Gera a resposta final com as médias dos últimos 7 dias
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
      console.error(error)
      return response.status(500).json({ error: 'An error occurred while fetching weekly averages.' })
    }
  }

  async getLatestMeasurement({ params, response }: HttpContext) {
    try {
      const object = await Object.findOrFail(params.object_id);
  
      const latestMeasurement = await Measurement.query()
        .where('object_id', object.id)
        .orderBy('timestamp', 'desc')
        .first();
      if (!latestMeasurement) {
        return response.status(404).json({
          error: 'No measurements found for this object.',
        });
      }
      return response.status(200).json(latestMeasurement);
    } catch (error) {
      console.error(error);
      return response.status(500).json({
        error: 'An error occurred while fetching the latest measurement.',
      });
    }
  }

  async checkWaterQuality(
  userId: number,
  ph?: number | undefined,
  turbidity?: number | undefined,
  temperature?: number | undefined,
  tds?: number | undefined
) {
  if (ph === undefined || turbidity === undefined || 
      temperature === undefined || tds === undefined) {
    console.warn('Parâmetros de qualidade da água incompletos', { ph, turbidity, temperature, tds });
    return;
  }

  const STANDARDS = {
    PH: { min: 6.5, max: 8.5 },
    TURBIDITY: { max: 5.0 },
    TEMPERATURE: { min: 10, max: 30 },
    TDS: { max: 500 }
  };

  const alerts = [
    ph < STANDARDS.PH.min && `pH baixo (${ph.toFixed(1)} < ${STANDARDS.PH.min})`,
    ph > STANDARDS.PH.max && `pH alto (${ph.toFixed(1)} > ${STANDARDS.PH.max})`,
    turbidity > STANDARDS.TURBIDITY.max && `Turbidez alta (${turbidity.toFixed(1)} > ${STANDARDS.TURBIDITY.max})`,
    temperature < STANDARDS.TEMPERATURE.min && `Temperatura baixa (${temperature.toFixed(1)}°C < ${STANDARDS.TEMPERATURE.min}°C)`,
    temperature > STANDARDS.TEMPERATURE.max && `Temperatura alta (${temperature.toFixed(1)}°C > ${STANDARDS.TEMPERATURE.max}°C)`,
    tds > STANDARDS.TDS.max && `TDS alto (${tds.toFixed(1)} > ${STANDARDS.TDS.max})`
  ].filter(Boolean);

  if (alerts.length > 0) {
    const title = '⚠️ Alerta de Qualidade da Água';
    const message = alerts.join('\n• ');
    const data = {
      type: 'water_alert',
      values: { ph, turbidity, temperature, tds }
    };

    try {
      await this.notificationService.sendToUser(
        userId,
        title,
        message,
        data
      );
      
      console.log(`Notificação enviada para usuário ${userId}`);
    } catch (error) {
      console.error(`Falha ao enviar notificação para usuário ${userId}:`, error);
      
      if (error.message.includes('DeviceNotRegistered')) {
        try {
          const user = await User.findOrFail(userId);
          if (user.notificationToken) {
            console.warn(`Tentando fallback com token direto para usuário ${userId}`);
            await this.notificationService.sendToToken(
              user.notificationToken,
              title,
              message,
              data
            );
          }
        } catch (fallbackError) {
          console.error(`Falha no fallback para usuário ${userId}:`, fallbackError);
        }
      }
    }
  }
}
}