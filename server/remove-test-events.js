import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function removeTestEvents() {
  try {
    console.log('Removendo eventos de teste...');
    
    // Remover todos os eventos (são apenas de teste)
    const result = await pool.query('DELETE FROM events');
    
    console.log(`✅ ${result.rowCount} eventos removidos com sucesso!`);
    
    // Verificar se foram removidos
    const checkResult = await pool.query('SELECT COUNT(*) as total FROM events');
    console.log(`📋 Total de eventos restantes: ${checkResult.rows[0].total}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

removeTestEvents(); 