import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from 'shared/schema';

// Configuração do pool de conexão
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/sitecard',
});

// Exportar a instância do drizzle com o schema
export const db = drizzle(pool, { schema });

// Função para executar migrações
export async function runMigrations() {
  try {
    console.log('Executando migrações...');
    // Aqui você pode adicionar a lógica de migração se necessário
    console.log('Migrações concluídas com sucesso');
  } catch (error) {
    console.error('Erro ao executar migrações:', error);
    throw error;
  }
} 