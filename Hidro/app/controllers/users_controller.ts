import { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import crypto from 'crypto'
import { DateTime } from 'luxon'

export default class UsersController {
  async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.only(['email'])
    const user = await User.findBy('email', email)

    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' })
    }

    const code = crypto.randomInt(100000, 999999).toString()

    const resetExpiresAt = DateTime.now().plus({ minutes: 15 })

    user.merge({
      reset_code: code,
      reset_expires_at: resetExpiresAt,
    })
    await user.save()

    const emailContent = `
      <h3>Recuperação de senha</h3>
      <p>Seu código de recuperação de senha é:</p>
      <h2>${code}</h2>
      <p>Esse código expirará em 15 minutos.</p>
    `
    await mail.send((message) => {
      message
        .to(email)
        .from('no-reply@seusite.com')
        .subject('Recuperação de senha')
        .html(emailContent)
    })

    return response.json({ message: 'Código enviado para seu e-mail' })
  }

  async validateResetCode({ request, response }: HttpContext) {
    const { code } = request.only(['code'])
    const user = await User.findBy('reset_code', code)

    if (!user) {
      return response.status(404).json({ message: 'Código inválido' })
    }

    if (user.reset_expires_at! < DateTime.now()) {
      return response.status(400).json({ message: 'Código expirado' })
    }

    return response.json({ message: 'Código válido', userId: user.id })
  }

  async resetPassword({ request, response }: HttpContext) {
    const { code, new_password } = request.only(['code', 'new_password'])
    const user = await User.findBy('reset_code', code)

    if (!user) {
      return response.status(404).json({ message: 'Código inválido' })
    }

    if (user.reset_expires_at! < DateTime.now()) {
      return response.status(400).json({ message: 'Código expirado' })
    }

    user.merge({
      password:(new_password),
      reset_code: null,
      reset_expires_at: null,
    })
    await user.save()

    return response.json({ message: 'Senha alterada com sucesso' })
  }
}