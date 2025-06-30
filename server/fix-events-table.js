import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function fixEventsTable() {
  try {
    console.log('Adicionando colunas que estão faltando na tabela events...');
    
    // Adicionar colunas que estão faltando
    const alterQueries = [
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS title_en VARCHAR',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS description_en TEXT',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT \'https://via.placeholder.com/300x200\'',
      'ALTER TABLE events ADD COLUMN IF NOT EXISTS location VARCHAR'
    ];
    
    for (const query of alterQueries) {
      console.log(`Executando: ${query}`);
      await pool.query(query);
    }
    
    console.log('✅ Colunas adicionadas com sucesso!');
    
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

fixEventsTable(); 