# 🚀 Instruções de Deploy no Hostinger

## 📋 Resumo dos Arquivos Criados

✅ **Arquivos de Deploy Criados:**
- `deploy-hostinger.md` - Guia completo detalhado
- `deploy-script.sh` - Script automatizado de deploy
- `ecosystem.config.js` - Configuração do PM2
- `nginx-sitecard.conf` - Configuração do Nginx
- `backup.sh` - Script de backup automático
- `env.example` - Exemplo de variáveis de ambiente
- `README-DEPLOY.md` - Guia rápido de deploy

## 🎯 Próximos Passos

### 1. Escolher Plano no Hostinger

**Recomendado: VPS**
- VPS 1 (2GB RAM, 1 CPU) - R$ 15/mês
- VPS 2 (4GB RAM, 2 CPU) - R$ 25/mês (recomendado)

**Alternativa: Hostinger Cloud**
- Plano Business - R$ 20/mês

### 2. Preparar o VPS

```bash
# 1. Conectar ao VPS via SSH
ssh root@seu_ip_vps

# 2. Instalar dependências
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# 3. Instalar PM2
npm install -g pm2
```

### 3. Fazer Upload dos Arquivos

**Opção A: Git (Recomendado)**
```bash
# No VPS
git clone https://github.com/seu-usuario/SiteCard-pio-main.git
cd SiteCard-pio-main
```

**Opção B: Upload Manual**
- Fazer upload via FTP/SFTP
- Extrair arquivos no VPS

### 4. Configurar Variáveis de Ambiente

```bash
# No VPS
cp env.example server/.env
nano server/.env
```

**Editar o arquivo .env com suas configurações:**
```env
# Banco de dados (já configurado)
DATABASE_URL=postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres

# Servidor
PORT=3000
NODE_ENV=production

# JWT (MUDE ESTA CHAVE!)
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_mude_para_uma_chave_forte

# Email (configurar SMTP do Hostinger)
SMTP_HOST=seu_smtp_hostinger.com
SMTP_PORT=587
SMTP_USER=seu_email@seudominio.com
SMTP_PASS=sua_senha_smtp
COMMERCIAL_TEAM_EMAIL=comercial@seudominio.com

# Frontend
FRONTEND_URL=https://seudominio.com
```

### 5. Executar Deploy

```bash
# No VPS
chmod +x deploy-script.sh backup.sh
./deploy-script.sh
```

### 6. Configurar Nginx

```bash
# No VPS
sudo cp nginx-sitecard.conf /etc/nginx/sites-available/sitecard

# Editar domínio no arquivo
sudo nano /etc/nginx/sites-available/sitecard
# Substituir "seudominio.com" pelo seu domínio real

# Ativar site
sudo ln -s /etc/nginx/sites-available/sitecard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. Configurar SSL

```bash
# No VPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

## 🔧 Configurações Específicas

### Configurar Email (SMTP do Hostinger)

1. **Acessar painel do Hostinger**
2. **Ir em Email > Configurações SMTP**
3. **Usar as configurações:**
   - Host: `smtp.hostinger.com`
   - Porta: `587`
   - Usuário: `seu_email@seudominio.com`
   - Senha: `sua_senha_email`

### Configurar Domínio

1. **Acessar painel do Hostinger**
2. **Ir em Domínios**
3. **Configurar DNS para apontar para o VPS**
4. **Aguardar propagação (até 24h)**

## 🛠️ Comandos de Manutenção

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs sitecard-server

# Reiniciar
pm2 restart sitecard-server

# Backup
./backup.sh

# Atualizar
git pull
./deploy-script.sh
```

## 🔍 Verificação

1. **Frontend**: `https://seudominio.com`
2. **API**: `https://seudominio.com/api/events`
3. **Login**: Testar login admin
4. **Logs**: `pm2 logs sitecard-server`

## 🚨 Problemas Comuns

### Aplicação não inicia
```bash
pm2 logs sitecard-server
cat server/.env
```

### Nginx não funciona
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### SSL não funciona
```bash
sudo certbot certificates
sudo certbot renew --dry-run
```

## 📞 Suporte

- **Logs**: `pm2 logs sitecard-server`
- **Status**: `pm2 status`
- **Nginx**: `sudo nginx -t`
- **Guia completo**: `deploy-hostinger.md`

## 🔒 Segurança

- ✅ Use HTTPS
- ✅ Configure firewall
- ✅ Mude chaves JWT
- ✅ Use senhas fortes
- ✅ Faça backups
- ✅ Mantenha atualizado

---

**🎉 Seu SiteCard está pronto para produção no Hostinger!** 