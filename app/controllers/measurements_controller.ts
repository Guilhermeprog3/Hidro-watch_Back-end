import type { HttpContext } from '@adonisjs/core/http'
import Measurement from '#models/measurement'
import Object from '#models/object'
import { createMeasurementValidator, updateMeasurementValidator } from '#validators/measurement'
import { DateTime } from 'luxon'
import ExpoNotificationService from '../service/ExpoNotificationService.js'

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
      const { ph, turbidity, temperature, tds } = await request.validateUsing(createMeasurementValidator)
      const object = await Object.findOrFail(params.object_id)
      const measurement = await object.related('measurements').create({
        ph,
        turbidity,
        temperature,
        tds,
        timestamp: DateTime.local(),
        average_measurement: (ph + turbidity+tds) / 3,
      })

      await this.checkWaterQuality(object.userId, ph, turbidity, temperature, tds)

      return response.status(201).json(measurement)
    } catch (error) {
      console.log(error)
      response.status(400).json({ error: 'erro' })
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
      const object = await Object.findOrFail(params.object_id);
      const today = DateTime.local();
      const startDate = today.minus({ days: 6 }).startOf('day');
  
      const measurements = await Measurement.query()
        .where('object_id', object.id)
        .where('timestamp', '>=', startDate.toISO())
        .orderBy('timestamp', 'asc');
  
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const date = startDate.plus({ days: i });
        return {
          day: date.toFormat('EEE'),
          average_measurement: 0
        };
      });
  
      measurements.forEach(measurement => {
        const dayIndex = Math.floor(measurement.timestamp.diff(startDate, 'days').days);
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyData[dayIndex].average_measurement = measurement.average_measurement;
        }
      });
  
      return response.status(200).json(weeklyData);
    } catch (error) {
      console.error(error);
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

  async checkWaterQuality(userId: number, ph?: number, turbidity?: number, temperature?: number, tds?: number) {
    if (ph === undefined || turbidity === undefined || temperature === undefined || tds === undefined) {
        console.error('Parâmetros de qualidade da água não fornecidos corretamente')
        return
    }

    const MIN_PH = 6.5;
    const MAX_PH = 8.5;
    const MAX_TURBIDITY = 5.0;
    const MIN_TEMPERATURE = 10;
    const MAX_TEMPERATURE = 30;
    const MAX_TDS = 500;

    let alertMessage = '';

    if (ph < MIN_PH) {
        alertMessage = `ATENÇÃO: pH ${ph.toFixed(2)} está abaixo do mínimo recomendado (${MIN_PH})`;
    } else if (ph > MAX_PH) {
        alertMessage = `ATENÇÃO: pH ${ph.toFixed(2)} está acima do máximo recomendado (${MAX_PH})`;
    } else if (turbidity > MAX_TURBIDITY) {
        alertMessage = `ATENÇÃO: Turbidez ${turbidity.toFixed(2)} está acima do máximo recomendado (${MAX_TURBIDITY})`;
    } else if (temperature < MIN_TEMPERATURE) {
        alertMessage = `ATENÇÃO: Temperatura ${temperature.toFixed(2)}°C está abaixo do mínimo recomendado (${MIN_TEMPERATURE}°C)`;
    } else if (temperature > MAX_TEMPERATURE) {
        alertMessage = `ATENÇÃO: Temperatura ${temperature.toFixed(2)}°C está acima do máximo recomendado (${MAX_TEMPERATURE}°C)`;
    } else if (tds > MAX_TDS) {
        alertMessage = `ATENÇÃO: TDS ${tds.toFixed(2)} está acima do máximo recomendado (${MAX_TDS})`;
    }

    if (alertMessage) {
        try {
            await this.notificationService.sendPushNotification(
                userId,
                'Alerta de Qualidade da Água',
                alertMessage
            );
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
        }
    }
  }
}