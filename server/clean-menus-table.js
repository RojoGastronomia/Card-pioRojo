import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function cleanMenusTable() {
  try {
    console.log('Limpando colunas duplicadas da tabela menus...');
    
    // Remover colunas em camelCase (manter apenas snake_case)
    const dropQueries = [
      'ALTER TABLE menus DROP COLUMN IF EXISTS "nameEn"',
      'ALTER TABLE menus DROP COLUMN IF EXISTS "descriptionEn"',
      'ALTER TABLE menus DROP COLUMN IF EXISTS "eventId"'
    ];
    
    for (const query of dropQueries) {
      console.log(`Executando: ${query}`);
      await pool.query(query);
    }
    
    console.log('✅ Colunas duplicadas removidas!');
    
    // Verificar a estrutura final
    const finalStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menus' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Estrutura final da tabela menus:');
    finalStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

cleanMenusTable(); 