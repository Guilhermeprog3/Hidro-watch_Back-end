const UsersController = () => import('#controllers/users_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const ObjectsController = () => import('#controllers/objects_controller')
const SessionControler = () => import('#controllers/session_controller')
const MeasurementsController = () => import('#controllers/measurements_controller')

// Rotas públicas
router.group(() => {
  // Rotas de sessão
  router.post('session', [SessionControler, 'store'])
  router.delete('session', [SessionControler, 'destroy'])

  // Rotas de verificação de e-mail
  router.post('email/verify-init', [UsersController, 'initEmailVerification'])
  router.post('email/verify-confirm', [UsersController, 'confirmEmailVerification'])
  
  // Rotas de recuperação de senha
  router.post('password/reset-code', [UsersController, 'forgotPassword'])
  router.post('password/validate-code', [UsersController, 'validateResetCode'])
  router.patch('password/reset', [UsersController, 'resetPassword'])

  router.post('users', [UsersController, 'store'])
})

router
  .group(() => {
    router.patch('users/:id/picture', [UsersController, 'uploadProfilePicture'])
      .use(middleware.fileUpload())
    router.patch('users/update-token', [UsersController, 'updateNotificationToken'])

    // Rotas de objetos e medições
    router.resource('objects', ObjectsController).apiOnly()
    router.resource('objects.measurements', MeasurementsController).apiOnly()
    router.get('objects/:object_id/weekly-average', [MeasurementsController, 'weeklyAverage'])
    router.get('objects/:object_id/measurements-latest', [MeasurementsController, 'getLatestMeasurement'])
    router.patch('objects/:id/edit', [ObjectsController, 'edit'])
    router.patch('objects/:id/toggle-connected', [ObjectsController, 'toggleConnected'])
  })
  
  .use(middleware.auth())