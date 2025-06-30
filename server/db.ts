import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// URL do banco Supabase
const DATABASE_URL = "postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres";

console.log("Inicializando banco de dados PostgreSQL...");
const queryClient = postgres(DATABASE_URL, { 
  max: 1,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 10
});

export const db = drizzle(queryClient);

// Função simples para criar tabelas iniciais
export async function runMigrations() {
  // As migrações agora são feitas via drizzle-kit CLI
  return true;
}

// Handle command line arguments
if (process.argv[2] === 'migrate') {
  console.log('Running migrations...');
  runMigrations()
    .then(() => {
      console.log('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}