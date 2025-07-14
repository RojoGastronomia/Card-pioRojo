const { Pool } = require('pg');

const pool = new Pool({
  connectionString: "postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function checkLocationField() {
  try {
    console.log('🔍 Verificando se o campo location existe na tabela orders...');
    
    // Verificar se o campo location existe
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'location'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Campo location encontrado na tabela orders:');
      console.log('   - Nome:', result.rows[0].column_name);
      console.log('   - Tipo:', result.rows[0].data_type);
      console.log('   - Pode ser nulo:', result.rows[0].is_nullable);
    } else {
      console.log('❌ Campo location NÃO encontrado na tabela orders');
      console.log('   Executando migração...');
      
      // Executar a migração
      await pool.query('ALTER TABLE orders ADD COLUMN location TEXT;');
      console.log('✅ Campo location adicionado com sucesso!');
    }
    
    // Verificar alguns pedidos para ver se têm o campo location
    const ordersResult = await pool.query(`
      SELECT id, location, created_at 
      FROM orders 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Últimos 5 pedidos:');
    ordersResult.rows.forEach(order => {
      console.log(`   - Pedido #${order.id}: location = "${order.location || 'NULL'}"`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao verificar campo location:', error);
  } finally {
    await pool.end();
  }
}

checkLocationField(); 