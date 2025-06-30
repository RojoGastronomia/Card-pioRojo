import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

async function testEmailSend() {
  console.log('=== TESTE DE ENVIO DE EMAIL ===\n');
  
  // Verificar se as variáveis estão configuradas
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('❌ Variáveis SMTP não configuradas!');
    console.log('Configure o arquivo .env primeiro.');
    return;
  }
  
  console.log('✅ Variáveis SMTP configuradas');
  
  try {
    // Criar transporter
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    // Verificar configuração
    await transporter.verify();
    console.log('✅ Configuração SMTP válida');
    
    // Carregar template de teste
    const templatePath = path.join(process.cwd(), 'server', 'email-templates', 'order-confirmation.hbs');
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    const compiledTemplate = Handlebars.compile(templateContent);
    
    // Dados de teste
    const testData = {
      userName: 'Usuário Teste',
      orderId: '12345',
      eventName: 'Evento Teste',
      eventDate: new Date().toLocaleDateString('pt-BR'),
      eventTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      location: 'Local Teste',
      totalAmount: '1500,00'
    };
    
    const html = compiledTemplate(testData);
    
    // Enviar email de teste
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@sitecard.com.br',
      to: process.env.SMTP_USER, // Enviar para o próprio email configurado
      subject: '🧪 Teste de Email - SiteCard',
      html: `
        <h2>Teste de Email do SiteCard</h2>
        <p>Este é um email de teste para verificar se o sistema de email está funcionando corretamente.</p>
        <hr>
        <h3>Template Renderizado:</h3>
        ${html}
        <hr>
        <p><strong>Data/Hora:</strong> ${new Date().toLocaleString('pt-BR')}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
        <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
      `
    });
    
    console.log('✅ Email de teste enviado com sucesso!');
    console.log('📧 Message ID:', info.messageId);
    console.log('📬 Verifique sua caixa de entrada:', process.env.SMTP_USER);
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Dica: Verifique se:');
      console.log('   - A senha de app está correta');
      console.log('   - A verificação em 2 etapas está ativada');
      console.log('   - O email está correto');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n💡 Dica: Verifique se:');
      console.log('   - O host SMTP está correto');
      console.log('   - A porta está correta');
      console.log('   - Não há firewall bloqueando');
    }
  }
}

testEmailSend().catch(console.error); 