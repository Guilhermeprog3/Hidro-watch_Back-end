export const forgotPasswordEmailTemplate = (code: string) => `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Alteração de Senha</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 20px auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        padding-bottom: 20px;
        border-bottom: 1px solid #eeeeee;
      }
      .header h1 {
        color: #333333;
        font-size: 24px;
        margin: 0;
      }
      .content {
        padding: 20px 0;
      }
      .content h2 {
        color: #555555;
        font-size: 20px;
        text-align: center;
        margin: 0 0 20px 0;
      }
      .code {
        background-color: #f8f9fa;
        padding: 15px;
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        color: #007bff;
        border-radius: 4px;
        margin: 20px 0;
      }
      .footer {
        text-align: center;
        padding-top: 20px;
        border-top: 1px solid #eeeeee;
        color: #777777;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Recuperação de Senha</h1>
      </div>
      <div class="content">
        <h2>Seu código de recuperação de senha é:</h2>
        <div class="code">${code}</div>
        <p style="text-align: center; color: #555555; font-size: 16px;">
          Use o código acima para redefinir sua senha. Ele expirará em <strong>10 minutos</strong>.
        </p>
      </div>
      <div class="footer">
        <p>Se você não solicitou essa Alteração, ignore este e-mail.</p>
        <p>&copy; ${new Date().getFullYear()} Hidrowatch. Todos os direitos reservados.</p>
      </div>
    </div>
  </body>
  </html>
`;