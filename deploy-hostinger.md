# 🚀 Guia de Deploy no Hostinger

## 📋 Pré-requisitos

- Conta no Hostinger com plano que suporte Node.js
- Banco de dados PostgreSQL (pode usar o Supabase que já está configurado)
- Domínio configurado (opcional)

## 🏗️ Estrutura do Projeto

```
SiteCard-pio-main/
├── client/          # Frontend React + Vite
├── server/          # Backend Node.js + Express
├── shared/          # Tipos compartilhados
└── package.json     # Scripts principais
```

## 📦 Preparação para Deploy

### 1. Configuração do Build

O projeto já está configurado para build. Os scripts principais são:

```bash
# Build do frontend
npm run build

# Start do servidor
npm start
```

### 2. Variáveis de Ambiente

Crie um arquivo `.env` no servidor com as seguintes variáveis:

```env
# Banco de dados (já configurado com Supabase)
DATABASE_URL=postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres

# Configurações do servidor
PORT=3000
NODE_ENV=production

# JWT Secret (mude para uma chave segura)
JWT_SECRET=sua_chave_jwt_super_secreta_aqui

# Email (configurar SMTP do Hostinger)
SMTP_HOST=seu_smtp_hostinger.com
SMTP_PORT=587
SMTP_USER=seu_email@seudominio.com
SMTP_PASS=sua_senha_smtp
COMMERCIAL_TEAM_EMAIL=comercial@seudominio.com

# Frontend URL
FRONTEND_URL=https://seudominio.com
```

### 3. Configuração do Hostinger

#### Opção 1: VPS (Recomendado)

1. **Contratar VPS** no Hostinger
2. **Acessar via SSH**:
   ```bash
   ssh root@seu_ip_vps
   ```

3. **Instalar Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Instalar PM2** (gerenciador de processos):
   ```bash
   npm install -g pm2
   ```

5. **Instalar Nginx** (proxy reverso):
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

#### Opção 2: Hostinger Cloud

1. **Acessar painel** do Hostinger
2. **Criar aplicação Node.js**
3. **Configurar variáveis de ambiente**

## 🚀 Deploy no VPS

### 1. Clonar o Projeto

```bash
# Conectar ao VPS
ssh root@seu_ip_vps

# Instalar Git
sudo apt install git

# Clonar o projeto
git clone https://github.com/seu-usuario/SiteCard-pio-main.git
cd SiteCard-pio-main
```

### 2. Instalar Dependências

```bash
# Instalar dependências principais
npm install

# Instalar dependências do cliente
cd client && npm install && cd ..

# Instalar dependências do servidor
cd server && npm install && cd ..
```

### 3. Configurar Variáveis de Ambiente

```bash
# Criar arquivo .env no servidor
nano server/.env
```

Adicionar as variáveis listadas acima.

### 4. Build do Frontend

```bash
# Build do cliente
npm run build
```

### 5. Configurar PM2

```bash
# Criar arquivo de configuração do PM2
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'sitecard-server',
    script: 'server/dist/index.js',
    cwd: '/root/SiteCard-pio-main',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

### 6. Compilar e Iniciar

```bash
# Compilar TypeScript do servidor
cd server && npm run build && cd ..

# Iniciar com PM2
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Configurar para iniciar com o sistema
pm2 startup
```

### 7. Configurar Nginx

```bash
# Criar configuração do Nginx
sudo nano /etc/nginx/sites-available/sitecard
```

```nginx
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;

    # Frontend (arquivos estáticos)
    location / {
        root /root/SiteCard-pio-main/client/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache para arquivos estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API (proxy para o servidor Node.js)
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SSE (Server-Sent Events)
    location /sse {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 24h;
    }
}
```

```bash
# Ativar o site
sudo ln -s /etc/nginx/sites-available/sitecard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

## 🔧 Configurações Adicionais

### 1. Firewall

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Monitoramento

```bash
# Ver logs do PM2
pm2 logs

# Ver status das aplicações
pm2 status

# Monitorar recursos
pm2 monit
```

### 3. Backup Automático

```bash
# Criar script de backup
nano backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
PROJECT_DIR="/root/SiteCard-pio-main"

# Criar backup do código
tar -czf $BACKUP_DIR/sitecard_code_$DATE.tar.gz $PROJECT_DIR

# Backup do banco (se necessário)
# pg_dump $DATABASE_URL > $BACKUP_DIR/database_$DATE.sql

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "sitecard_code_*.tar.gz" -mtime +7 -delete
```

```bash
# Tornar executável
chmod +x backup.sh

# Adicionar ao crontab (backup diário às 2h)
crontab -e
# Adicionar: 0 2 * * * /root/backup.sh
```

## 🚀 Deploy no Hostinger Cloud (Alternativa)

Se preferir usar o Hostinger Cloud:

1. **Acessar painel** do Hostinger
2. **Criar aplicação Node.js**
3. **Conectar repositório Git**
4. **Configurar build commands**:
   ```bash
   npm install
   npm run build
   ```
5. **Configurar start command**:
   ```bash
   npm start
   ```
6. **Configurar variáveis de ambiente** no painel
7. **Configurar domínio personalizado**

## 🔍 Verificação do Deploy

### 1. Testar Frontend
- Acessar `https://seudominio.com`
- Verificar se carrega corretamente

### 2. Testar API
- Acessar `https://seudominio.com/api/events`
- Verificar se retorna dados

### 3. Testar Login
- Tentar fazer login como admin
- Verificar se funciona

### 4. Verificar Logs
```bash
# Logs do PM2
pm2 logs sitecard-server

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🛠️ Comandos Úteis

```bash
# Reiniciar aplicação
pm2 restart sitecard-server

# Parar aplicação
pm2 stop sitecard-server

# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs sitecard-server --lines 100

# Atualizar código
git pull
npm run build
pm2 restart sitecard-server
```

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs**: `pm2 logs`
2. **Verificar status**: `pm2 status`
3. **Verificar Nginx**: `sudo nginx -t`
4. **Verificar firewall**: `sudo ufw status`

## 🔒 Segurança

- ✅ Use HTTPS
- ✅ Configure firewall
- ✅ Mantenha Node.js atualizado
- ✅ Use variáveis de ambiente seguras
- ✅ Faça backups regulares
- ✅ Monitore logs

---

**🎉 Seu sistema SiteCard está pronto para produção no Hostinger!** 