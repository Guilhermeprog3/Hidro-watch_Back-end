const UsersController = () => import('#controllers/users_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const ObjectsController = () => import('#controllers/objects_controller')
const SessionControler = () => import('#controllers/session_controller')
const MeasurementsController = () => import('#controllers/measurements_controller')


router.post('session', [SessionControler, 'store'])
router.delete('session', [SessionControler, 'destroy'])

router.resource('user', UsersController).apiOnly()
router
  .group(() => {
    router.resource('object', ObjectsController).apiOnly()
    router.resource('object.measurements', MeasurementsController).apiOnly()
    router.get('object/:object_id/weekly-average', [MeasurementsController, 'weeklyAverage'])
    router.get('object/:object_id/measurements/latest', [MeasurementsController, 'getLatestMeasurement'])
    router.patch('object/:id/edit', [ObjectsController, 'edit'])
  })
  .use(middleware.auth())

router.post('/password/reset-code', [UsersController, 'forgotPassword'])
router.post('/password/validate-code', [UsersController, 'validateResetCode'])
router.patch('/password/reset', [UsersController, 'resetPassword'])