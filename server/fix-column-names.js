import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function fixColumnNames() {
  try {
    console.log('Renomeando colunas da tabela events para snake_case...');
    
    // Renomear colunas para snake_case
    const renameQueries = [
      'ALTER TABLE events RENAME COLUMN "eventType" TO event_type',
      'ALTER TABLE events RENAME COLUMN "menuOptions" TO menu_options'
    ];
    
    for (const query of renameQueries) {
      console.log(`Executando: ${query}`);
      await pool.query(query);
    }
    
    console.log('✅ Colunas renomeadas com sucesso!');
    
    // Verificar a estrutura final
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'events' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura final da tabela events:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

fixColumnNames(); 