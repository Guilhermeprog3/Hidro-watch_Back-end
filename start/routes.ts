import fs from 'node:fs'
import router from '@adonisjs/core/services/router'
import swaggerUi from 'swagger-ui-dist'
import yaml from 'js-yaml'
import { middleware } from './kernel.js'

const UsersController = () => import('#controllers/users_controller')
const ObjectsController = () => import('#controllers/objects_controller')
const SessionControler = () => import('#controllers/session_controller')
const MeasurementsController = () => import('#controllers/measurements_controller')

router.group(() => {
  router.post('session', [SessionControler, 'store'])
  router.delete('session', [SessionControler, 'destroy'])

  router.post('email/verify-init', [UsersController, 'initEmailVerification'])
  router.post('email/verify-confirm', [UsersController, 'confirmEmailVerification'])
  
  router.post('password/reset-code', [UsersController, 'forgotPassword'])
  router.post('password/validate-code', [UsersController, 'validateResetCode'])
  router.patch('password/reset', [UsersController, 'resetPassword'])

  router.post('users', [UsersController, 'store'])
})

router.resource('user', UsersController).apiOnly()
router.patch('user/:id/picture', [UsersController, 'uploadProfilePicture'])
  .use(middleware.fileUpload())

router.group(() => {
  router.patch('users/update-token', [UsersController, 'updateNotificationToken'])

  router.resource('object', ObjectsController).apiOnly()
  router.resource('object.measurements', MeasurementsController).apiOnly()
  
  router.get('object/:object_id/weekly-average', [MeasurementsController, 'weeklyAverage'])
  router.get('object/:object_id/measurements-latest', [MeasurementsController, 'getLatestMeasurement'])
  
  router.patch('object/:id/edit', [ObjectsController, 'edit'])
  router.patch('object/:id/toggle-connected', [ObjectsController, 'toggleConnected'])
})
.use(middleware.auth())

const SWAGGER_PATH = swaggerUi.getAbsoluteFSPath()

router.get('/docs', async ({ response }) => {
  const swaggerFile = fs.readFileSync('swagger.yaml', 'utf-8')

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Hidro-watch API Docs</title>
      <link rel="stylesheet" href="/docs/swagger-ui.css" />
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="/docs/swagger-ui-bundle.js" crossorigin></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            spec: ${JSON.stringify(yaml.load(swaggerFile))},
            dom_id: '#swagger-ui',
          });
        };
      </script>
    </body>
    </html>
  `
  return response.header('Content-Type', 'text/html').send(html)
})

router.get('/docs/*', ({ request, response }) => {
  const path = request.param('*').join('/')
  const filePath = `${SWAGGER_PATH}/${path}`

  if (fs.existsSync(filePath)) {
    return response.download(filePath)
  }
  return response.notFound()
})