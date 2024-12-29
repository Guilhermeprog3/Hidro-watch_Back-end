const UsersController = () => import('#controllers/users_controller')
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
const ObjectsController = () => import('#controllers/objects_controller')
const SessionControler = () => import('#controllers/session_controller')

router.post('session', [SessionControler, 'store'])
router.delete('session', [SessionControler, 'destroy'])

router.resource('user', UsersController).apiOnly()
router
  .group(() => {
    router.resource('object', ObjectsController).apiOnly()
  })
  .use(middleware.auth())
