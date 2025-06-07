import { createSessionValidator } from '#validators/session'
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { errors } from '@adonisjs/auth'

export default class SessionController {
  async store({ request, response }: HttpContext) {
    try {
      const { email, password } = await request.validateUsing(createSessionValidator)
      const user = await User.verifyCredentials(email, password)
      const accessToken = await User.accessTokens.create(user)

      return response.ok({
        data: {
          token: accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          }
        }
      })

    } catch (error) {
      if (error instanceof errors.E_INVALID_CREDENTIALS) {
        return response.unauthorized({
          errors: [{
            message: 'Credenciais inválidas',
            field: 'email',
          }]
        })
      }
      return response.internalServerError({
        errors: [{
          message: 'Ocorreu um erro ao processar seu login',
        }]
      })
    }
  }

  async destroy({ auth, response }: HttpContext) {
    try {
      const user = auth.user!
      
      if (!user.currentAccessToken) {
        return response.status(400).send({
          message: 'Nenhum token de acesso encontrado para este usuário.',
        })
      }
      
      await User.accessTokens.delete(user, user.currentAccessToken.identifier)
      
      return response.status(203).send({
        message: 'Logout realizado com sucesso.',
      })
    } catch (error) {
      return response.status(500).send({
        message: 'Ocorreu um erro durante o logout. Tente novamente mais tarde.',
      })
    }
  }
}