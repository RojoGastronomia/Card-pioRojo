import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

// Configuração para banco de dados local SQLite
const sqlite = new Database('local-dev.db');
export const db = drizzle(sqlite);

// Executar migrações
migrate(db, { migrationsFolder: './drizzle' });

console.log('✅ Banco de dados local SQLite configurado com sucesso!');
console.log('📁 Arquivo: local-dev.db');

export default db; 