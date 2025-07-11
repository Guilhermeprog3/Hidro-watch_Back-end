import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

  from: {
    address: env.get('MAIL_FROM_ADDRESS', 'no-reply@example.com'),
    name: env.get('MAIL_FROM_NAME', 'AdonisJS'),
  },

  mailers: {
    smtp: transports.smtp({
      host: env.get('SMTP_HOST') as string,
      port: Number(env.get('SMTP_PORT')),
      auth: {
        type: 'login',
        user: env.get('SMTP_USERNAME') as string,
        pass: env.get('SMTP_PASSWORD') as string,
      },
    }),

    resend: transports.resend({
      key: env.get('RESEND_API_KEY') as string,
      baseUrl: 'https://api.resend.com'
    }),
  },
})

export default mailConfig