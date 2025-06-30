import pg from 'pg';
const { Pool } = pg;

async function checkOrdersBoleto() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Verificando pedidos com boleto...');
    
    // Buscar todos os pedidos
    const allOrders = await pool.query('SELECT id, status, boleto_url, created_at FROM orders ORDER BY id DESC');
    
    console.log('\n=== TODOS OS PEDIDOS ===');
    allOrders.rows.forEach(order => {
      console.log(`Pedido #${order.id}: Status=${order.status}, Boleto=${order.boleto_url || 'NÃO'}, Criado=${order.created_at}`);
    });
    
    // Buscar pedidos com boleto
    const ordersWithBoleto = await pool.query('SELECT id, status, boleto_url, created_at FROM orders WHERE boleto_url IS NOT NULL ORDER BY id DESC');
    
    console.log('\n=== PEDIDOS COM BOLETO ===');
    if (ordersWithBoleto.rows.length === 0) {
      console.log('Nenhum pedido tem boleto anexado.');
    } else {
      ordersWithBoleto.rows.forEach(order => {
        console.log(`Pedido #${order.id}: Status=${order.status}, Boleto=${order.boleto_url}, Criado=${order.created_at}`);
      });
    }
    
    // Buscar pedidos aguardando pagamento
    const pendingOrders = await pool.query("SELECT id, status, boleto_url, created_at FROM orders WHERE status = 'aguardando_pagamento' ORDER BY id DESC");
    
    console.log('\n=== PEDIDOS AGUARDANDO PAGAMENTO ===');
    if (pendingOrders.rows.length === 0) {
      console.log('Nenhum pedido aguardando pagamento.');
    } else {
      pendingOrders.rows.forEach(order => {
        console.log(`Pedido #${order.id}: Status=${order.status}, Boleto=${order.boleto_url || 'NÃO'}, Criado=${order.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await pool.end();
  }
}

checkOrdersBoleto(); 