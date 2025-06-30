import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Verificar se as configurações SMTP estão disponíveis
function validateSmtpConfig() {
  const required = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Configurações SMTP faltando: ${missing.join(', ')}`);
  }
}

// Configurar o transporter do nodemailer
function createTransporter() {
  validateSmtpConfig();
  
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Configurações adicionais para melhor compatibilidade
    tls: {
      rejectUnauthorized: false
    },
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  });
}

// Função para carregar o template
async function loadTemplate(templateName: string): Promise<string> {
  try {
    const templatePath = path.join(process.cwd(), 'server', 'email-templates', `${templateName}.hbs`);
    console.log(`[EMAIL] Carregando template: ${templatePath}`);
    
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    console.log(`[EMAIL] Template carregado com sucesso: ${templateName}`);
    
    return templateContent;
  } catch (error) {
    console.error(`[EMAIL] Erro ao carregar template ${templateName}:`, error);
    throw new Error(`Template não encontrado: ${templateName}`);
  }
}

// Função para enviar email
export async function sendEmail({ to, subject, template, data }: EmailData): Promise<void> {
  console.log(`[EMAIL] Iniciando envio de email para: ${to}`);
  console.log(`[EMAIL] Assunto: ${subject}`);
  console.log(`[EMAIL] Template: ${template}`);
  
  try {
    // Criar transporter
    const transporter = createTransporter();
    
    // Verificar configuração do transporter
    console.log('[EMAIL] Verificando configuração SMTP...');
    await transporter.verify();
    console.log('[EMAIL] Configuração SMTP válida');
    
    // Carregar o template
    const templateContent = await loadTemplate(template);
    
    // Compilar o template com os dados
    console.log('[EMAIL] Compilando template com dados...');
    const compiledTemplate = Handlebars.compile(templateContent);
    const html = compiledTemplate(data);
    console.log('[EMAIL] Template compilado com sucesso');

    // Enviar o email
    console.log('[EMAIL] Enviando email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@sitecard.com.br',
      to,
      subject,
      html,
    });
    
    console.log(`[EMAIL] ✅ Email enviado com sucesso!`);
    console.log(`[EMAIL] Message ID: ${info.messageId}`);
    console.log(`[EMAIL] Para: ${to}`);
    console.log(`[EMAIL] Assunto: ${subject}`);
    
  } catch (error) {
    console.error('[EMAIL] ❌ Erro ao enviar email:', error);
    
    // Log detalhado do erro
    if (error instanceof Error) {
      console.error('[EMAIL] Detalhes do erro:', {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
        command: (error as any).command
      });
    }
    
    // Re-throw com mensagem mais informativa
    throw new Error(`Falha ao enviar email para ${to}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Função para testar configuração de email
export async function testEmailConfig(): Promise<boolean> {
  try {
    console.log('[EMAIL] Testando configuração de email...');
    
    const transporter = createTransporter();
    await transporter.verify();
    
    console.log('[EMAIL] ✅ Configuração de email válida');
    return true;
  } catch (error) {
    console.error('[EMAIL] ❌ Erro na configuração de email:', error);
    return false;
  }
} 