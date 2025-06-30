import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function checkTableStructure() {
  try {
    console.log('Verificando estrutura da tabela orders...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'orders'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Estrutura da tabela orders:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Verificar se a coluna date existe
    const hasDateColumn = result.rows.some(row => row.column_name === 'date');
    console.log(`\n✅ Coluna 'date' existe na tabela orders: ${hasDateColumn}`);
    
    if (hasDateColumn) {
      console.log('✅ A coluna date está disponível para filtros e cálculos!');
    } else {
      console.log('❌ PROBLEMA: A coluna date não existe na tabela orders!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure(); 