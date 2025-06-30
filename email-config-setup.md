# 🔧 Configuração do Sistema de Email

## ❌ Problema Identificado

O sistema de email não está funcionando porque as variáveis de ambiente SMTP não estão configuradas no arquivo `.env`.

## ✅ Solução

### 1. Editar o arquivo `.env`

Adicione as seguintes configurações ao seu arquivo `.env`:

```env
# Configurações de Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gmail
SMTP_FROM=noreply@sitecard.com.br
COMMERCIAL_TEAM_EMAIL=suporte@rojogastronomia.com

# URLs do Sistema
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# Configurações do Servidor
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=sua_chave_jwt_super_secreta_aqui_mude_para_uma_chave_forte

# Configurações de Sessão
SESSION_SECRET=outra_chave_secreta_para_sessoes
```

### 2. Configurar Gmail para SMTP

Para usar Gmail como servidor SMTP:

1. **Ative a verificação em 2 etapas** na sua conta Google
2. **Gere uma "Senha de App"**:
   - Acesse: https://myaccount.google.com/apppasswords
   - Selecione "Email" e "Outro (nome personalizado)"
   - Digite "SiteCard" como nome
   - Clique em "Gerar"
   - Use a senha gerada no campo `SMTP_PASS`

### 3. Alternativas de SMTP

Se não quiser usar Gmail, você pode usar:

- **Outlook/Hotmail**: `smtp-mail.outlook.com`
- **Yahoo**: `smtp.mail.yahoo.com`
- **Provedor próprio**: Consulte seu provedor de email

### 4. Testar a Configuração

Após configurar, execute o teste:

```bash
node test-email-config.js
```

### 5. Configurações Específicas

#### Para Gmail:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Para Outlook:
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### Para Yahoo:
```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

## 🔍 Verificação

Após configurar, o teste deve mostrar:

```
✅ Configuração SMTP válida
✅ Template carregado com sucesso
```

## 📧 Templates Disponíveis

O sistema possui os seguintes templates de email:

1. `boleto-notification.hbs` - Email para cliente com boleto
2. `boleto-notification-commercial.hbs` - Notificação para comercial
3. `boleto-delivery-confirmation.hbs` - Confirmação de envio
4. `boleto-delivery-error.hbs` - Notificação de erro
5. `new-order-notification-commercial.hbs` - Novo pedido
6. `order-confirmation.hbs` - Confirmação de pedido

## 🚀 Próximos Passos

1. Configure as variáveis SMTP no `.env`
2. Teste a configuração
3. Reinicie o servidor
4. Teste o envio de email através do sistema

## ⚠️ Importante

- Nunca commite o arquivo `.env` no Git
- Use senhas de app para Gmail (não a senha normal)
- Teste sempre em ambiente de desenvolvimento primeiro 