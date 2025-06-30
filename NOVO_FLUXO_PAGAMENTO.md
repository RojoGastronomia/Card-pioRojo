# Novo Fluxo de Pagamento - SiteCard

## Resumo das Mudanças

O sistema foi modificado para implementar um novo fluxo de pagamento onde apenas o boleto bancário está disponível, com geração manual pelo comercial e envio automático de emails.

## Mudanças Implementadas

### 1. Frontend - Modal de Pagamento (`client/src/components/orders/payment-modal.tsx`)

- **Métodos desabilitados**: Cartão de crédito e PIX foram desabilitados temporariamente
- **Apenas boleto disponível**: O modal agora mostra apenas a opção de boleto bancário
- **Informações do novo fluxo**: Adicionada seção explicativa sobre o processo
- **Botão alterado**: "Pagar" foi alterado para "Confirmar Pedido"

### 2. Backend - Endpoint de Criação de Pedido (`server/routes.ts`)

- **Email automático**: Após criar o pedido, o sistema envia email para o comercial
- **Template**: `new-order-notification-commercial.hbs`
- **Dados incluídos**: Detalhes do pedido, cliente e link para o painel administrativo

### 3. Backend - Endpoint de Upload de Boleto (`server/routes.ts`)

- **Email para cliente**: Após upload do boleto, envia email com o documento
- **Email de confirmação**: Envia confirmação para o comercial
- **Email de erro**: Em caso de falha, notifica o comercial sobre o erro
- **Templates utilizados**:
  - `boleto-notification.hbs` (cliente)
  - `boleto-delivery-confirmation.hbs` (comercial)
  - `boleto-delivery-error.hbs` (erro)

### 4. Backend - Endpoint de Download de Boleto (`server/routes.ts`)

- **Autenticação**: Verifica se o usuário está logado
- **Autorização**: Verifica se é o dono do pedido ou admin
- **Download seguro**: Retorna o arquivo PDF com headers apropriados

### 5. Frontend - Modal de Detalhes do Pedido (`client/src/components/orders/order-details-modal.tsx`)

- **Botão de download**: Mostra "Baixar Boleto" quando disponível
- **Download direto**: Permite baixar o arquivo PDF do boleto

### 6. Frontend - Página Admin de Pedidos (`client/src/pages/admin/orders-page.tsx`)

- **Upload de boleto**: Interface para anexar arquivo PDF
- **Progresso**: Mostra progresso do upload
- **Validação**: Verifica tipo e tamanho do arquivo

## Templates de Email Criados

### 1. `new-order-notification-commercial.hbs`
- **Destinatário**: Equipe comercial
- **Conteúdo**: Notificação de novo pedido que precisa de boleto
- **Ação**: Link para painel administrativo

### 2. `boleto-notification.hbs`
- **Destinatário**: Cliente
- **Conteúdo**: Boleto disponível com link para download
- **Ação**: Link para baixar boleto e acessar sistema

### 3. `boleto-delivery-confirmation.hbs`
- **Destinatário**: Equipe comercial
- **Conteúdo**: Confirmação de que boleto foi enviado
- **Ação**: Informações sobre próximos passos

### 4. `boleto-delivery-error.hbs`
- **Destinatário**: Equipe comercial
- **Conteúdo**: Notificação de erro no envio
- **Ação**: Detalhes do erro e alternativas de contato

## Fluxo Completo

1. **Cliente faz pedido** → Sistema cria pedido no banco
2. **Email automático** → Sistema envia notificação para comercial
3. **Comercial gera boleto** → Acessa painel admin e anexa PDF
4. **Upload automático** → Sistema salva arquivo e atualiza pedido
5. **Email para cliente** → Sistema envia boleto por email
6. **Confirmação comercial** → Sistema confirma envio para comercial
7. **Cliente baixa boleto** → Pode baixar pelo email ou sistema

## Configurações Necessárias

### Variáveis de Ambiente
```env
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=seu-email@exemplo.com
SMTP_PASS=sua-senha
SMTP_FROM=noreply@sitecard.com.br
COMMERCIAL_TEAM_EMAIL=comercial@exemplo.com
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:3001
```

### Diretórios
- `server/uploads/boletos/` - Diretório para armazenar boletos
- `server/email-templates/` - Templates de email

## Status dos Métodos de Pagamento

- ✅ **Boleto Bancário**: Ativo e funcionando
- ❌ **Cartão de Crédito**: Desabilitado temporariamente
- ❌ **PIX**: Desabilitado temporariamente

## Próximos Passos

1. **Testar fluxo completo** em ambiente de desenvolvimento
2. **Configurar SMTP** para envio de emails
3. **Criar usuários comerciais** no sistema
4. **Treinar equipe** no novo processo
5. **Monitorar logs** para identificar possíveis problemas

## Observações Importantes

- Os métodos antigos de pagamento foram mantidos no código mas desabilitados na interface
- O sistema continua compatível com a estrutura existente
- Em caso de necessidade, é possível reativar os métodos antigos facilmente
- Todos os emails incluem links para o sistema e informações de contato
- O sistema mantém logs detalhados para auditoria 