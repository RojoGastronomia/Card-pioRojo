# 🍽️ SiteCard - Sistema de Cardápio Digital

Sistema completo de gerenciamento de cardápios digitais para eventos corporativos, desenvolvido para a **Rojo Gastronomia**.

## 🚀 Funcionalidades

### 👥 **Usuários**
- Sistema de autenticação com diferentes níveis de acesso
- Painel administrativo para gestão de usuários
- Perfis: Admin, Comercial, Cliente

### 📋 **Eventos**
- Criação e gerenciamento de eventos corporativos
- Tipos: Coffee Break, Almoço, Jantar, etc.
- Configuração de locais e horários

### 🍽️ **Cardápios e Pratos**
- Sistema completo de cardápios
- Gestão de pratos por categoria
- Preços e descrições detalhadas

### 📦 **Pedidos**
- Sistema de pedidos online
- Cálculo automático de valores
- Geração de boletos
- Histórico de pedidos

### 📧 **Sistema de Emails**
- Confirmação automática de pedidos
- Notificações para equipe comercial
- Envio de boletos por email

## 🛠️ Tecnologias

### Frontend
- **React** + **TypeScript**
- **Vite** para build
- **Tailwind CSS** para estilização
- **React Query** para gerenciamento de estado
- **React Hook Form** para formulários

### Backend
- **Node.js** + **TypeScript**
- **Express.js** para API
- **MongoDB** como banco principal
- **PostgreSQL** (legado)
- **Nodemailer** para emails
- **Handlebars** para templates de email

### Infraestrutura
- **Vercel** para deploy do frontend
- **Railway/Render** para deploy do backend
- **MongoDB Atlas** para banco de dados

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- MongoDB Atlas (conta gratuita)

### 1. Clone o repositório
```bash
git clone https://github.com/RojoGastronomia/Card-pioRojo.git
cd Card-pioRojo
```

### 2. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp env.example .env

# Configure as variáveis no .env
```

### 3. Instale as dependências
```bash
# Dependências do backend
npm install

# Dependências do frontend
cd client
npm install
cd ..
```

### 4. Configure o banco de dados
```bash
# Teste a conexão com MongoDB
node test-mongodb.js

# Execute a migração se necessário
node migrate-to-mongodb.js
```

### 5. Configure o sistema de emails
```bash
# Teste a configuração de email
node test-email-config.js
```

## 🚀 Deploy

### Frontend (Vercel)
1. Conecte o repositório na Vercel
2. Configure a pasta `client/` como raiz
3. Configure as variáveis de ambiente
4. Deploy automático

### Backend (Railway/Render)
1. Crie um novo projeto Node.js
2. Configure as variáveis de ambiente
3. Deploy automático

## 📧 Configuração de Email

Configure as seguintes variáveis no `.env`:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gmail
SMTP_FROM=noreply@sitecard.com.br

# URLs do Sistema
FRONTEND_URL=https://seu-frontend.vercel.app
BACKEND_URL=https://seu-backend.railway.app

# Email da equipe comercial
COMMERCIAL_TEAM_EMAIL=comercial@rojogastronomia.com
```

## 🧪 Testes

### Teste de Conexão com MongoDB
```bash
node test-mongodb.js
```

### Teste de Email
```bash
node test-email-event-simple.js
```

### Teste de API
```bash
# Inicie o servidor
npm run dev

# Teste as rotas
curl http://localhost:5000/api/events
```

## 📁 Estrutura do Projeto

```
SiteCard-pio-main/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── hooks/         # Custom hooks
│   │   └── context/       # Contextos React
│   └── package.json
├── server/                # Backend Node.js
│   ├── routes.ts          # Rotas da API
│   ├── storage.ts         # Camada de dados
│   ├── email.ts           # Sistema de emails
│   └── email-templates/   # Templates de email
├── shared/                # Tipos compartilhados
├── migrations/            # Migrações do banco
└── package.json
```

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato:
- **Email**: suporte@rojogastronomia.com
- **Telefone**: (11) 1234-5678

---

**Desenvolvido com ❤️ para Rojo Gastronomia** 