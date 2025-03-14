import type { HttpContext } from '@adonisjs/core/http'
import Measurement from '#models/measurement'
import Object from '#models/object'
import { createMeasurementValidator, updateMeasurementValidator } from '#validators/measurement'
import { DateTime } from 'luxon'

export default class MeasurementsController {
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
      const { ph, turbidity, temperature } = await request.validateUsing(createMeasurementValidator)
      const object = await Object.findOrFail(params.object_id)
      const measurement = await object.related('measurements').create({
        ph,
        turbidity,
        temperature,
        timestamp: DateTime.local(),
        average_measurement: (ph + turbidity ) / 2,
      })

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
      const { ph, turbidity, temperature } = await request.validateUsing(updateMeasurementValidator)

      measurement.merge({ ph, turbidity, temperature })
      await measurement.save()

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
      const last7Days = Array.from({ length: 7 }, (_, i) => today.minus({ days: 6 - i }));

      const daysOfWeek = last7Days.map(date => date.toFormat('EEE'));
  
      const weeklyData: Record<string, number | null> = {};
  
      daysOfWeek.forEach(day => {
        weeklyData[day] = null;
      });
  
      const measurements = await Measurement.query()
        .where('object_id', object.id)
        .whereBetween('timestamp', [
          today.minus({ days: 6 }).startOf('day').toISO(),
          today.endOf('day').toISO(),
        ]);
  
      measurements.forEach(measurement => {
        const dayName = measurement.timestamp.toFormat('EEE');
        weeklyData[dayName] = measurement.average_measurement;
      });
  
      const orderedWeeklyData = daysOfWeek.map(day => ({
        day,
        average_measurement: weeklyData[day] !== null ? weeklyData[day] : 0,
      }));
  
      return response.status(200).json(orderedWeeklyData);
    } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'An error occurred while fetching the weekly data.' });
    }
  }
  async getLatestMeasurement({ params, response }: HttpContext) {
    try {
      const object = await Object.findOrFail(params.object_id);
      console.log(object)
  
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
}