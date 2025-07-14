# 📧 Fluxo Completo de E-mails Automáticos - SiteCard

## ✅ Implementação Concluída

O sistema agora possui um fluxo completo de e-mails automáticos conforme solicitado. Todos os templates e lógicas foram implementados e testados.

---

## 🔄 Fluxo de E-mails por Cenário

### 1. **Pedido Criado com Sucesso**
```
Cliente → Email de Confirmação (order-confirmation.hbs)
Comercial → Email de Notificação (new-order-notification-commercial.hbs)
```

**Dados enviados para o cliente:**
- Nome do usuário
- ID do pedido
- Nome do evento
- Data e horário do evento
- Local
- Quantidade de convidados
- Seleção do menu
- Valor total
- Taxa de garçom
- Data do pedido

**Dados enviados para o comercial:**
- ID do pedido
- Nome do evento
- Data e horário do evento
- Local
- Quantidade de convidados
- Seleção do menu
- Valor total
- Taxa de garçom
- Data do pedido
- Nome do cliente
- Email do cliente
- Telefone do cliente
- Link para o painel administrativo

---

### 2. **Erro na Criação do Pedido**
```
Comercial → Email de Erro (boleto-delivery-error.hbs)
```

**Tipos de erro cobertos:**
- **Erro de Validação:** Dados inválidos enviados pelo cliente
- **Erro do Sistema:** Falha interna do servidor

**Dados enviados para o comercial:**
- Tipo de erro (validação ou sistema)
- Mensagem detalhada do erro
- Timestamp do erro
- Dados do usuário (se disponíveis)
- Link para o painel administrativo

---

### 3. **Upload do Boleto**
```
Cliente → Email com Boleto (boleto-notification.hbs)
Comercial → Email de Confirmação (boleto-delivery-confirmation.hbs)
```

**Dados enviados para o cliente:**
- Nome do usuário
- ID do pedido
- Nome do evento
- Data do evento
- Valor total
- Link para download do boleto
- Link para o sistema

**Dados enviados para o comercial:**
- ID do pedido
- Nome do evento
- Data do evento
- Valor total
- Data de envio do boleto
- Nome do cliente
- Email do cliente

---

### 4. **Erro no Envio do Boleto**
```
Comercial → Email de Erro (boleto-delivery-error.hbs)
```

**Dados enviados para o comercial:**
- ID do pedido
- Nome do evento
- Data do evento
- Valor total
- Data da tentativa
- Nome do cliente
- Email do cliente
- Telefone do cliente
- WhatsApp do cliente
- Mensagem detalhada do erro
- Código do erro
- Timestamp do erro
- Link para o painel administrativo

---

## 📋 Templates Utilizados

| Template | Descrição | Destinatário |
|----------|-----------|--------------|
| `order-confirmation.hbs` | Confirmação de pedido criado | Cliente |
| `new-order-notification-commercial.hbs` | Notificação de novo pedido | Comercial |
| `boleto-notification.hbs` | Boleto disponível | Cliente |
| `boleto-delivery-confirmation.hbs` | Confirmação de envio do boleto | Comercial |
| `boleto-delivery-error.hbs` | Notificação de erro | Comercial |

---

## 🔧 Configuração Necessária

### Variáveis de Ambiente (.env)
```env
# Configurações SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app-gmail
SMTP_FROM=noreply@sitecard.com.br

# Email da equipe comercial (fallback)
COMMERCIAL_TEAM_EMAIL=suporte@rojogastronomia.com

# URLs do sistema
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
```

### Usuários Comerciais
O sistema busca automaticamente usuários com papel "Comercial" no banco de dados. Se não encontrar, usa o email padrão configurado em `COMMERCIAL_TEAM_EMAIL`.

---

## 🚀 Funcionalidades Implementadas

### ✅ Pedido Criado
- [x] Email de confirmação para o cliente
- [x] Email de notificação para o comercial
- [x] Tratamento de erro se email falhar

### ✅ Erro na Criação
- [x] Email de erro para o comercial (validação)
- [x] Email de erro para o comercial (sistema)
- [x] Detalhes completos do erro

### ✅ Upload do Boleto
- [x] Email com boleto para o cliente
- [x] Email de confirmação para o comercial
- [x] Tratamento de erro se email falhar

### ✅ Erro no Envio do Boleto
- [x] Email de erro para o comercial
- [x] Detalhes completos do erro

---

## 📊 Logs e Monitoramento

Todos os envios de email são logados com:
- `[NEW FLOW]` - Identificação do novo fluxo
- Detalhes do destinatário
- Status do envio
- Erros detalhados

**Exemplos de logs:**
```
[NEW FLOW] Email de confirmação enviado para o cliente cliente@email.com sobre o pedido #123
[NEW FLOW] Email enviado para 2 comercial(is) sobre o pedido #123
[NEW FLOW] Email de erro de validação enviado para 1 comercial(is)
```

---

## 🛡️ Tratamento de Erros

### Estratégia de Fallback
1. **Email falha → Pedido continua:** Se o email falhar, o pedido não é afetado
2. **Comercial não encontrado → Email padrão:** Se não houver usuários comerciais, usa email padrão
3. **Dados faltando → Valores padrão:** Se dados estiverem faltando, usa valores seguros

### Logs de Erro
- Todos os erros são logados com detalhes
- Erros de email não quebram o fluxo principal
- Emails de erro são enviados para o comercial em caso de falha

---

## 🎯 Resultado Final

O sistema agora possui um fluxo completo e robusto de e-mails automáticos que:

1. **Notifica o cliente** sobre a criação do pedido
2. **Notifica o comercial** sobre novos pedidos
3. **Envia boletos** automaticamente para o cliente
4. **Confirma envios** para o comercial
5. **Reporta erros** para o comercial em todos os cenários

**Status:** ✅ **IMPLEMENTADO E FUNCIONAL** 