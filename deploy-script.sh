#!/bin/bash

# Script de Deploy Automatizado para SiteCard
# Uso: ./deploy-script.sh

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do SiteCard..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script na raiz do projeto SiteCard"
    exit 1
fi

# 1. Instalar dependências
log "📦 Instalando dependências..."
npm install

log "📦 Instalando dependências do cliente..."
cd client && npm install && cd ..

log "📦 Instalando dependências do servidor..."
cd server && npm install && cd ..

# 2. Verificar arquivo .env
if [ ! -f "server/.env" ]; then
    warn "Arquivo .env não encontrado no servidor!"
    echo "Crie o arquivo server/.env com as seguintes variáveis:"
    echo ""
    echo "DATABASE_URL=postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres"
    echo "PORT=3000"
    echo "NODE_ENV=production"
    echo "JWT_SECRET=sua_chave_jwt_super_secreta_aqui"
    echo "SMTP_HOST=seu_smtp_hostinger.com"
    echo "SMTP_PORT=587"
    echo "SMTP_USER=seu_email@seudominio.com"
    echo "SMTP_PASS=sua_senha_smtp"
    echo "COMMERCIAL_TEAM_EMAIL=comercial@seudominio.com"
    echo "FRONTEND_URL=https://seudominio.com"
    echo ""
    read -p "Pressione Enter após criar o arquivo .env..."
fi

# 3. Build do frontend
log "🔨 Fazendo build do frontend..."
npm run build

# 4. Build do servidor
log "🔨 Compilando servidor TypeScript..."
cd server && npm run build && cd ..

# 5. Criar diretório de logs se não existir
mkdir -p logs

# 6. Parar aplicação se estiver rodando
if pm2 list | grep -q "sitecard-server"; then
    log "🛑 Parando aplicação atual..."
    pm2 stop sitecard-server || true
fi

# 7. Iniciar aplicação
log "🚀 Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js

# 8. Salvar configuração do PM2
log "💾 Salvando configuração do PM2..."
pm2 save

# 9. Verificar status
log "📊 Verificando status da aplicação..."
pm2 status

# 10. Mostrar logs recentes
log "📋 Últimos logs da aplicação:"
pm2 logs sitecard-server --lines 10

echo ""
log "✅ Deploy concluído com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o Nginx com o arquivo nginx-sitecard.conf"
echo "2. Configure SSL com Certbot"
echo "3. Configure o firewall"
echo "4. Teste a aplicação em https://seudominio.com"
echo ""
echo "🛠️ Comandos úteis:"
echo "- Ver logs: pm2 logs sitecard-server"
echo "- Reiniciar: pm2 restart sitecard-server"
echo "- Status: pm2 status"
echo "- Monitor: pm2 monit" 