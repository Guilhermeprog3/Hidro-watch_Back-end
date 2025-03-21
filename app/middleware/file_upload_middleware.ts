import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class FileUploadMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const file = ctx.request.file('profile_picture', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png'],
    })
    if (!file) {
      return ctx.response.status(400).json({
        message: 'Nenhum arquivo enviado',
      })
    }

    if (!file.isValid) {
      return ctx.response.status(400).json({
        message: 'Arquivo inválido',
        errors: file.errors,
      })
    }
  
    await file.move('uploads')

    if (file.hasErrors) {
      return ctx.response.status(500).json({
        message: 'Erro ao processar o upload do arquivo',
        errors: file.errors,
      })
    }

    ctx.request.updateBody({
      ...ctx.request.body(),
      profile_picture: file.filePath,
    })

    return await next()
  }
}