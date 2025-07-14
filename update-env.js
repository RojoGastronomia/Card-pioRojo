import fs from 'fs';

console.log('🔄 Atualizando arquivo .env com configuração do MongoDB...\n');

// Ler o arquivo .env atual
let envContent = '';
try {
  envContent = fs.readFileSync('.env', 'utf8');
  console.log('✅ Arquivo .env lido com sucesso');
} catch (error) {
  console.log('⚠️ Arquivo .env não encontrado, criando novo...');
}

// Substituir as configurações do banco de dados
const newEnvContent = `# MongoDB Configuration
MONGODB_URI=mongodb+srv://RojoMicro:<db_password>@cluster0.yodlbcu.mongodb.net/sitecard?retryWrites=true&w=majority&appName=Cluster0

# PostgreSQL (mantido para referência, mas não será usado)
DATABASE_URL=postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres

NODE_ENV=development
PORT=5000
JWT_SECRET=Rojo@2025
SESSION_SECRET=RojoMamaFilo@2025

# Configuração email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=pedidos.rojogastronomia@gmail.com
SMTP_PASS=fvwcduedszrovcpd
SMTP_FROM=noreply.rojogastronomia@gmail.com

# Email da equipe comercial
COMMERCIAL_TEAM_EMAIL=suporte@rojogastronomia.com

# URLs do Sistema
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
`;

try {
  fs.writeFileSync('.env', newEnvContent);
  console.log('✅ Arquivo .env atualizado com sucesso!');
  console.log('\n⚠️ IMPORTANTE: Substitua <db_password> pela senha real do seu banco MongoDB Atlas');
  console.log('📝 Exemplo: MONGODB_URI=mongodb+srv://RojoMicro:minhasenha123@cluster0.yodlbcu.mongodb.net/sitecard?retryWrites=true&w=majority&appName=Cluster0');
} catch (error) {
  console.error('❌ Erro ao atualizar arquivo .env:', error.message);
} 