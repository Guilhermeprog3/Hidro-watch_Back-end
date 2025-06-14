# 💧 Hidro-Watch API

> Backend da aplicação Hidro-Watch, um sistema inteligente de monitoramento de qualidade da água.

## 📖 Sobre o Projeto

Este é o backend da aplicação Hidro-Watch, desenvolvido com **AdonisJS v6**. Ele fornece uma **API RESTful completa** para gerenciar:

- Usuários
- Dispositivos de monitoramento (objetos)
- Medições de qualidade da água

O sistema foi projetado para ser **robusto, seguro e escalável**, com autenticação baseada em token, validação com VineJS, envio de notificações via Expo e upload de imagens com Cloudinary.

---

## 📚 Documentação da API

A documentação Swagger dos endpoints está disponível em:

```
http://127.0.0.1:3333/docs
```

---

## ✨ Funcionalidades Principais

### 👤 Gerenciamento de Usuários
- Login/Logout com e-mail e senha
- Cadastro de novos usuários com validação
- Verificação de e-mail em duas etapas
- Recuperação e redefinição de senha
- Upload de foto de perfil via Cloudinary

### 💧 Gerenciamento de Dispositivos (Objetos)
- CRUD completo dos dispositivos
- Favoritar dispositivos

### 📊 Gerenciamento de Medições
- Registro de medições: **pH, turbidez, temperatura, TDS**
- Cálculo automático da média
- Acesso à última medição e média semanal

### 🔔 Notificações
- Envio de notificações push via Expo quando parâmetros estão fora dos limites ideais

---

## 🛠️ Tecnologias Utilizadas

- **Backend:** AdonisJS v6
- **Linguagem:** TypeScript
- **Banco de Dados:** PostgreSQL + Lucid ORM
- **Autenticação:** Token-based (`@adonisjs/auth`)
- **Validação:** VineJS
- **Upload de Arquivos:** Cloudinary
- **Notificações Push:** Expo SDK
- **Email:** Adonis Mail (SMTP)

---

## 🚀 Começando

### ✅ Pré-requisitos

- Node.js (v20.x)
- npm, yarn ou pnpm
- PostgreSQL

### 📥 Instalação

Clone o repositório:

```bash
git clone https://github.com/guilhermeprog3/hidro-watch_back-end.git
cd hidro-watch_back-end
```

Instale as dependências:

```bash
npm install
```

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Gere uma chave da aplicação:

```bash
node ace generate:key
```

Copie a chave gerada e cole no campo `APP_KEY` no arquivo `.env`.

Execute as migrações:

```bash
node ace migration:run
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

---

## 🧪 Scripts Disponíveis

| Comando              | Descrição                                           |
|----------------------|-----------------------------------------------------|
| `npm run dev`        | Inicia o servidor com Hot Reload                   |
| `npm run build`      | Compila o projeto TypeScript → JavaScript          |
| `npm start`          | Inicia o servidor em modo produção                 |

---

## 🏗️ Estrutura do Projeto

```
├── app/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   ├── validators/
│   └── service/
├── config/
├── database/
│   ├── migrations/
│   └── seeders/
├── public/
├── start/
│   ├── kernel.ts
│   └── routes.ts
├── swagger.yaml
├── tests/
├── .env.example
```

---

## 📄 Exemplo de `.env`

```env
# Geral
PORT=3333
HOST=0.0.0.0
NODE_ENV=development
APP_KEY= # Cole aqui a chave gerada
LOG_LEVEL=debug

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario_db
DB_PASSWORD=sua_senha_db
DB_DATABASE=hidrowatch_db

# Email (SMTP)
SMTP_HOST=seu_host_smtp
SMTP_PORT=587
SMTP_USERNAME=seu_usuario_smtp
SMTP_PASSWORD=sua_senha_smtp

# Cloudinary
CLOUDINARY_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=sua_api_secret
```

---

## 👨‍💻 Autor

**Guilherme Silva Rios**  
🔗 GitHub: [@guilhermeprog3](https://github.com/guilhermeprog3)  
🌐 Portifolio: [guilhermeriosdev.vercel.app](https://guilhermeriosdev.vercel.app)
