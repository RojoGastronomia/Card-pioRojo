# 🚀 Deploy SiteCard no Hostinger

Este guia te ajudará a fazer o deploy do sistema SiteCard no Hostinger de forma rápida e segura.

## 📋 Arquivos de Deploy

- `deploy-hostinger.md` - Guia completo detalhado
- `deploy-script.sh` - Script automatizado de deploy
- `ecosystem.config.js` - Configuração do PM2
- `nginx-sitecard.conf` - Configuração do Nginx
- `backup.sh` - Script de backup automático
- `env.example` - Exemplo de variáveis de ambiente

## ⚡ Deploy Rápido (VPS)

### 1. Preparar o VPS

```bash
# Conectar ao VPS
ssh root@seu_ip_vps

# Instalar dependências
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx git

# Instalar PM2
npm install -g pm2
```

### 2. Clonar e Configurar

```bash
# Clonar projeto
git clone https://github.com/seu-usuario/SiteCard-pio-main.git
cd SiteCard-pio-main

# Tornar scripts executáveis
chmod +x deploy-script.sh backup.sh

# Criar arquivo .env
cp env.example server/.env
nano server/.env  # Editar com suas configurações
```

### 3. Executar Deploy

```bash
# Executar script de deploy
./deploy-script.sh
```

### 4. Configurar Nginx

```bash
# Copiar configuração
sudo cp nginx-sitecard.conf /etc/nginx/sites-available/sitecard

# Editar domínio
sudo nano /etc/nginx/sites-available/sitecard

# Ativar site
sudo ln -s /etc/nginx/sites-available/sitecard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Configurar SSL

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com
```

## 🔧 Configurações Importantes

### Variáveis de Ambiente (.env)

```env
# Banco de dados (já configurado)
DATABASE_URL=postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres

# Servidor
PORT=3000
NODE_ENV=production

# JWT (MUDE ESTA CHAVE!)
JWT_SECRET=sua_chave_jwt_super_secreta_aqui

# Email (configurar SMTP do Hostinger)
SMTP_HOST=seu_smtp_hostinger.com
SMTP_PORT=587
SMTP_USER=seu_email@seudominio.com
SMTP_PASS=sua_senha_smtp
COMMERCIAL_TEAM_EMAIL=comercial@seudominio.com

# Frontend
FRONTEND_URL=https://seudominio.com
```

### Configuração do Nginx

Edite o arquivo `nginx-sitecard.conf` e substitua:
- `seudominio.com` pelo seu domínio real
- `/root/SiteCard-pio-main` pelo caminho correto do projeto

## 🛠️ Comandos de Manutenção

```bash
# Ver status da aplicação
pm2 status

# Ver logs
pm2 logs sitecard-server

# Reiniciar aplicação
pm2 restart sitecard-server

# Fazer backup
./backup.sh

# Atualizar código
git pull
./deploy-script.sh
```

## 🔍 Verificação do Deploy

1. **Frontend**: Acesse `https://seudominio.com`
2. **API**: Teste `https://seudominio.com/api/events`
3. **Login**: Tente fazer login como admin
4. **Logs**: Verifique com `pm2 logs sitecard-server`

## 🚨 Troubleshooting

### Problema: Aplicação não inicia
```bash
# Verificar logs
pm2 logs sitecard-server

# Verificar arquivo .env
cat server/.env

# Verificar se o banco está acessível
node -e "console.log('Testando conexão...')"
```

### Problema: Nginx não funciona
```bash
# Verificar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log

# Reiniciar Nginx
sudo systemctl restart nginx
```

### Problema: SSL não funciona
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew --dry-run
```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `pm2 logs sitecard-server`
2. Verifique o status: `pm2 status`
3. Verifique o Nginx: `sudo nginx -t`
4. Consulte o guia completo: `deploy-hostinger.md`

## 🔒 Segurança

- ✅ Use HTTPS
- ✅ Configure firewall
- ✅ Mude as chaves JWT
- ✅ Use senhas fortes
- ✅ Faça backups regulares
- ✅ Mantenha o sistema atualizado

---

**🎉 Seu SiteCard está pronto para produção!** 