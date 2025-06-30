import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function fixImageUrlColumn() {
  try {
    console.log('Renomeando coluna imageUrl para image_url...');
    
    // Remover a coluna imageUrl duplicada (já temos image_url)
    await pool.query('ALTER TABLE events DROP COLUMN IF EXISTS "imageUrl"');
    
    console.log('✅ Coluna imageUrl removida (já existe image_url)!');
    
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

fixImageUrlColumn(); 