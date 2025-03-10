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
        averageMeasurement: (ph + turbidity + temperature) / 3,
      })

      return response.status(201).json(measurement)
    } catch (error) {
      console.log(error)
      response.status(400).json({ error: 'erro' })
    }
  }

  async show({ params, response }: HttpContext) {
    try {
      const measurement = await Measurement.findByOrFail('id', params.id)
      return measurement
    } catch (error) {
      return response.status(404).json({
        error: 'Measurement not found.',
      })
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
      const measurements = await Measurement.query()
        .where('object_id', object.id)
        .where('timestamp', '>=', DateTime.local().startOf('week').toSQL())
        .where('timestamp', '<=', DateTime.local().endOf('week').toSQL());
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const averages = daysOfWeek.reduce((acc, day) => {
        acc[day] = 0;
        return acc;
      }, {} as Record<string, number>);

      measurements.forEach((measurement) => {
        const day = measurement.timestamp?.weekdayShort;
        if (day) {
          averages[day] = measurement.averageMeasurement;
        }
      });
      const formattedAverages = daysOfWeek.map((day) => ({
        day,
        average: averages[day],
      }));

      return response.status(200).json(formattedAverages);
    } catch (error) {
      return response.status(404).json({
        error: 'Object not found or no measurements available for the week.',
      });
    }
  }
  
}
