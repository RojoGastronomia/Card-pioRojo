import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const sql = postgres(process.env.DATABASE_URL);

async function createCategoriesTable() {
  try {
    console.log('Criando tabela categories...');
    
    await sql`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        name_en TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `;
    
    console.log('✅ Tabela categories criada com sucesso!');
    
    // Verificar se a tabela foi criada
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'categories';
    `;
    
    if (tables.length > 0) {
      console.log('✅ Tabela categories existe no banco de dados');
    } else {
      console.log('❌ Tabela categories não foi encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error);
  } finally {
    await sql.end();
  }
}

createCategoriesTable(); 