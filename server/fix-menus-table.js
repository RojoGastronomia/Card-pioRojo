import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function fixMenusTable() {
  try {
    console.log('Corrigindo estrutura da tabela menus...');
    
    // Primeiro, verificar a estrutura atual
    const currentStructure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'menus' 
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura atual da tabela menus:');
    currentStructure.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Adicionar colunas que estão faltando
    const alterQueries = [
      'ALTER TABLE menus ADD COLUMN IF NOT EXISTS name_en VARCHAR',
      'ALTER TABLE menus ADD COLUMN IF NOT EXISTS description_en TEXT'
    ];
    
    for (const query of alterQueries) {
      console.log(`Executando: ${query}`);
      await pool.query(query);
    }
    
    // Renomear colunas para snake_case se necessário
    const renameQueries = [
      'ALTER TABLE menus RENAME COLUMN IF EXISTS "nameEn" TO name_en',
      'ALTER TABLE menus RENAME COLUMN IF EXISTS "descriptionEn" TO description_en'
    ];
    
    for (const query of renameQueries) {
      console.log(`Executando: ${query}`);
      try {
        await pool.query(query);
      } catch (error) {
        console.log(`  - Coluna já está correta ou não existe`);
      }
    }
    
    console.log('✅ Tabela menus corrigida!');
    
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

fixMenusTable(); 