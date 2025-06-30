import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { events } from 'shared/schema';

// Configuração do banco Supabase
const DATABASE_URL = "postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres";

console.log("Testando conexão com o banco de dados...");
const queryClient = postgres(DATABASE_URL, { 
  max: 1,
  ssl: 'require',
  idle_timeout: 20,
  connect_timeout: 10
});

// Criar a instância do drizzle
const db = drizzle(queryClient);

async function testConnection() {
  try {
    console.log('1. Testando conexão básica...');
    
    // Teste 1: Contar eventos
    console.log('2. Contando eventos...');
    const countResult = await queryClient`SELECT COUNT(*) as count FROM events`;
    console.log(`Total de eventos no banco: ${countResult[0].count}`);
    
    // Teste 2: Buscar eventos com SQL direto
    console.log('3. Buscando eventos com SQL direto...');
    const rawEvents = await queryClient`SELECT * FROM events LIMIT 3`;
    console.log(`Eventos encontrados com SQL direto: ${rawEvents.length}`);
    rawEvents.forEach((event, index) => {
      console.log(`Evento ${index + 1}: ID=${event.id}, Título=${event.title}`);
    });
    
    // Teste 3: Buscar eventos com Drizzle
    console.log('4. Buscando eventos com Drizzle...');
    const drizzleEvents = await db.select().from(events).limit(3);
    console.log(`Eventos encontrados com Drizzle: ${drizzleEvents.length}`);
    drizzleEvents.forEach((event, index) => {
      console.log(`Evento ${index + 1}: ID=${event.id}, Título=${event.title}`);
    });
    
    // Teste 4: Verificar schema
    console.log('5. Verificando schema da tabela events...');
    const schemaResult = await queryClient`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      ORDER BY ordinal_position
    `;
    console.log('Schema da tabela events:');
    schemaResult.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await queryClient.end();
  }
}

// Executar o teste
testConnection(); 