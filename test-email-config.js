import 'dotenv/config';
import nodemailer from 'nodemailer';
import fs from 'fs/promises';
import path from 'path';

async function testEmailConfig() {
  console.log('=== TESTE DE CONFIGURAÇÃO DE EMAIL ===\n');
  
  // Verificar variáveis de ambiente
  console.log('Variáveis de ambiente SMTP:');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NÃO CONFIGURADO');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || 'NÃO CONFIGURADO');
  console.log('SMTP_USER:', process.env.SMTP_USER || 'NÃO CONFIGURADO');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'CONFIGURADO' : 'NÃO CONFIGURADO');
  console.log('SMTP_FROM:', process.env.SMTP_FROM || 'NÃO CONFIGURADO');
  console.log('COMMERCIAL_TEAM_EMAIL:', process.env.COMMERCIAL_TEAM_EMAIL || 'NÃO CONFIGURADO');
  
  // Verificar se os templates existem
  console.log('\n=== VERIFICANDO TEMPLATES ===');
  try {
    const templatePath = path.join(process.cwd(), 'server', 'email-templates');
    const files = await fs.readdir(templatePath);
    console.log('Templates encontrados:', files);
    
    // Verificar templates específicos
    const requiredTemplates = ['order-confirmation.hbs', 'new-order-notification.hbs'];
    for (const template of requiredTemplates) {
      const exists = await fs.access(path.join(templatePath, template)).then(() => true).catch(() => false);
      console.log(`${template}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
    }
  } catch (error) {
    console.error('Erro ao verificar templates:', error.message);
  }
  
  // Testar configuração do transporter
  console.log('\n=== TESTANDO TRANSPORTER ===');
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    // Verificar se o transporter foi criado
    console.log('Transporter criado:', !!transporter);
    
    // Testar verificação de configuração
    await transporter.verify();
    console.log('✅ Configuração SMTP válida');
  } catch (error) {
    console.error('❌ Erro na configuração SMTP:', error.message);
  }
  
  // Testar carregamento de template
  console.log('\n=== TESTANDO CARREGAMENTO DE TEMPLATE ===');
  try {
    const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'order-confirmation.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    console.log('✅ Template carregado com sucesso');
    console.log('Tamanho do template:', templateContent.length, 'caracteres');
  } catch (error) {
    console.error('❌ Erro ao carregar template:', error.message);
  }
}

testEmailConfig().catch(console.error); 