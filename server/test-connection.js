import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function testConnection() {
  try {
    console.log('Testando conexão com Supabase...');
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', result.rows[0]);
    
    // Verificar se as tabelas existem
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas existentes:', tablesResult.rows.map(r => r.table_name));
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection(); 