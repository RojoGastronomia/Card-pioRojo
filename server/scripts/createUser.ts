import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { users } from 'shared/schema';

// Configuração do banco Supabase
const DATABASE_URL = "postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres";

console.log("Conectando ao banco de dados...");
const queryClient = postgres(DATABASE_URL, { 
  max: 1,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 10
});

// Criar a instância do drizzle
const db = drizzle(queryClient);

async function createUser() {
  try {
    console.log('Criando usuário administrador...');
    
    // Gerar hash da senha
    const password = '03032012FeKa<3';
    const hashedPassword = bcrypt.hashSync(password, 10);
    console.log('Hash da senha gerado:', hashedPassword);
    
    // Inserir usuário
    const [user] = await db.insert(users).values({
      username: 'admin',
      email: 'suporte@rojogastronomia.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin'
    }).returning();
    
    console.log('✅ Usuário criado com sucesso!');
    console.log('ID:', user.id);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    
    // Testar se a senha está correta
    const isValid = bcrypt.compareSync(password, hashedPassword);
    console.log('Senha válida:', isValid);

  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
  } finally {
    await queryClient.end();
  }
}

// Executar o script
createUser(); 