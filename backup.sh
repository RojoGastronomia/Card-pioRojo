#!/bin/bash

# Script de Backup Automático para SiteCard
# Uso: ./backup.sh

set -e

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
PROJECT_DIR="/root/SiteCard-pio-main"
RETENTION_DAYS=7

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

log "🔄 Iniciando backup do SiteCard..."

# Backup do código (excluindo node_modules e logs)
log "📦 Fazendo backup do código..."
tar -czf $BACKUP_DIR/sitecard_code_$DATE.tar.gz \
    --exclude='node_modules' \
    --exclude='client/node_modules' \
    --exclude='server/node_modules' \
    --exclude='logs' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='dist' \
    --exclude='client/dist' \
    --exclude='server/dist' \
    -C $PROJECT_DIR .

# Backup do banco de dados (se DATABASE_URL estiver configurado)
if [ -f "$PROJECT_DIR/server/.env" ]; then
    source $PROJECT_DIR/server/.env
    if [ ! -z "$DATABASE_URL" ]; then
        log "🗄️ Fazendo backup do banco de dados..."
        pg_dump "$DATABASE_URL" > $BACKUP_DIR/database_$DATE.sql 2>/dev/null || warn "Não foi possível fazer backup do banco"
    fi
fi

# Backup dos logs (últimos 7 dias)
log "📋 Fazendo backup dos logs..."
if [ -d "$PROJECT_DIR/logs" ]; then
    tar -czf $BACKUP_DIR/logs_$DATE.tar.gz -C $PROJECT_DIR logs/
fi

# Backup das configurações
log "⚙️ Fazendo backup das configurações..."
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
    -C $PROJECT_DIR \
    server/.env \
    ecosystem.config.js \
    nginx-sitecard.conf \
    deploy-script.sh \
    backup.sh

# Criar arquivo de metadados
cat > $BACKUP_DIR/backup_info_$DATE.txt << EOF
Backup realizado em: $(date)
Versão do Node.js: $(node --version)
Versão do npm: $(npm --version)
Tamanho do backup de código: $(du -h $BACKUP_DIR/sitecard_code_$DATE.tar.gz | cut -f1)
Tamanho do backup de logs: $(du -h $BACKUP_DIR/logs_$DATE.tar.gz 2>/dev/null | cut -f1 || echo "N/A")
Tamanho do backup de configurações: $(du -h $BACKUP_DIR/config_$DATE.tar.gz | cut -f1)
EOF

# Limpar backups antigos
log "🧹 Limpando backups antigos..."
find $BACKUP_DIR -name "sitecard_code_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "database_*.sql" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "logs_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "backup_info_*.txt" -mtime +$RETENTION_DAYS -delete

# Mostrar estatísticas
log "📊 Estatísticas do backup:"
echo "Backup de código: $BACKUP_DIR/sitecard_code_$DATE.tar.gz"
echo "Backup de logs: $BACKUP_DIR/logs_$DATE.tar.gz"
echo "Backup de configurações: $BACKUP_DIR/config_$DATE.tar.gz"
echo "Informações: $BACKUP_DIR/backup_info_$DATE.txt"

if [ -f "$BACKUP_DIR/database_$DATE.sql" ]; then
    echo "Backup do banco: $BACKUP_DIR/database_$DATE.sql"
fi

echo ""
log "✅ Backup concluído com sucesso!"
echo "Backups mantidos por $RETENTION_DAYS dias" 