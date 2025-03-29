import { HttpContext  } from '@adonisjs/core/http'
import User from '#models/user'
import mail from '@adonisjs/mail/services/main'
import crypto from 'crypto'
import { DateTime } from 'luxon'
import { createUserValidator, updateUserValidator } from '#validators/user'
import cloudinary from '#config/cloudinary'
import { forgotPasswordEmailTemplate } from '../../templates/forgotPasswordEmail.js'
import fs from 'fs/promises'

export default class UsersController {
  async index() {
    const users = await User.query().preload('objects')
    return users
  }

  async store({ request }: HttpContext) {
    const { name, email, password } = await request.validateUsing(createUserValidator)
    const user = await User.create({ name, email, password })
    return user
  }

  async show({ params, response }: HttpContext) {
    try {
      const user = await User.findByOrFail('id', params.id)
      await user.load('objects')
      return user
    } catch (error) {
      return response.status(404).json({ message: 'User not found' })
    }
  }

  async update({ params, request }: HttpContext) {
    const user = await User.findBy('id', params.id)
    const { name, password } = await request.validateUsing(updateUserValidator)
    user!.merge({ name, password })
    await user!.save()
    return user
  }

  async destroy({ params, response }: HttpContext) {
    try {
      const user = await User.findByOrFail('id', params.id)
      await user.delete()
      return response.status(203)
    } catch (error) {
      return response.status(404).json({ message: 'User not found' })
    }
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = request.only(['email'])
    const user = await User.findBy('email', email)

    if (!user) {
      return response.status(404).json({ message: 'Usuário não encontrado' })
    }

    user.merge({
      reset_code: null,
      reset_expires_at: null,
    })
    await user.save()

    const code = crypto.randomInt(100000, 999999).toString()
    const resetExpiresAt = DateTime.now().plus({ minutes: 10 })

    user.merge({
      reset_code: code,
      reset_expires_at: resetExpiresAt,
    })
    await user.save()

    const emailContent = forgotPasswordEmailTemplate(code)

    await mail.send((message) => {
      message
        .to(email)
        .from('hidrowatch@gmail.com', 'Hidro Watch')
        .subject('Recuperação de Senha - Hidro Watch')
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
    console.log(new_password)
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

  async uploadProfilePicture({ request, params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    const filePath = request.body().profile_picture

    if (!filePath) {
      return response.status(400).json({ message: 'Nenhum arquivo enviado' })
    }

    try {
      if (user.profile_picture) {
        const publicId = user.profile_picture.split('/').pop()?.split('.')[0]
        await cloudinary.uploader.destroy(`profile_pictures/${publicId}`)
      }

      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'profile_pictures',
      })

      user.profile_picture = result.secure_url
      await user.save()

      await fs.unlink(filePath)

      return response.json({ message: 'Foto de perfil atualizada', user })
    } catch (error) {
      console.error(error)
      return response.status(500).json({ message: 'Erro ao fazer upload da imagem' })
    }
  }
}