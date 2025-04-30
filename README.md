# SiteCard - Sistema de Gestão de Eventos e Cardápios

Sistema web para gestão de eventos e cardápios, permitindo que clientes visualizem e selecionem menus para seus eventos.

## 🚀 Tecnologias

Este projeto foi desenvolvido com as seguintes tecnologias:

### Frontend
- React 18
- TypeScript
- TailwindCSS
- Shadcn/UI
- React Query
- React Hook Form
- Wouter (Roteamento)

### Backend
- Node.js
- Express
- PostgreSQL
- Drizzle ORM
- Passport.js (Autenticação)

## 💻 Pré-requisitos

Antes de começar, verifique se você tem os seguintes requisitos:
- Node.js (versão 18 ou superior)
- PostgreSQL (versão 14 ou superior)
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório:
   ```sh
   git clone https://github.com/SEU_USUARIO/NOME_DO_REPOSITORIO.git
   cd NOME_DO_REPOSITORIO
   ```

2. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env` e preencha os valores necessários.

3. Instale as dependências do backend:
   ```sh
   cd server
   npm install
   ```

4. Instale as dependências do frontend:
   ```sh
   cd ../client
   npm install
   ```

## Scripts

- **Backend:**
  - `npm run dev` (desenvolvimento)
  - `npm start` (produção)
- **Frontend:**
  - `npm run dev` (desenvolvimento)
  - `npm run build` (gerar build para produção)

## Deploy na Render.com

1. Suba o projeto para o GitHub.
2. Siga o passo a passo da Render para criar um Web Service (backend) e um Static Site (frontend).
3. Configure as variáveis de ambiente conforme `.env.example`.
4. Crie um banco PostgreSQL gratuito na Render e use a URL fornecida.

## Observações
- O backend espera as variáveis de ambiente do arquivo `.env`.
- O frontend espera a variável `VITE_API_URL` apontando para o backend online.
- O backup do sistema salva arquivos na pasta `server/backups` (atenção: plataformas gratuitas podem apagar arquivos após reinício).

---

Se tiver dúvidas, consulte a documentação ou abra uma issue!

## 🌟 Funcionalidades

- 👤 Autenticação de usuários
- 📅 Gestão de eventos
- 🍽️ Gestão de cardápios
- 🛒 Carrinho de compras
- 📊 Painel administrativo
- 💼 Múltiplos perfis de usuário

## 🔐 Segurança

O sistema implementa várias medidas de segurança:
- Autenticação segura com Passport.js
- Hash de senhas com Scrypt
- Proteção contra XSS e CSRF
- Validação de dados com Zod
- Controle de acesso baseado em funções (RBAC)

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👥 Contribuição

Contribuições são sempre bem-vindas! Por favor, leia o [CONTRIBUTING.md](CONTRIBUTING.md) para saber como contribuir.

## 📫 Contato

Se você tiver alguma dúvida ou sugestão, por favor abra uma issue ou entre em contato. 