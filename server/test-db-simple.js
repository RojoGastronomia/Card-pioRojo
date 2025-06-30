import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://postgres:03032012FeKa%3C3@db.kaozvieefihavxsowfak.supabase.co:5432/postgres'
});

async function testDatabase() {
  try {
    console.log('=== TESTANDO CONEXÃO COM BANCO ===');
    
    // Testar conexão básica
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK:', result.rows[0]);
    
    // Verificar tabelas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas existentes:', tablesResult.rows.map(r => r.table_name));
    
    // Verificar dados nas tabelas principais
    const ordersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log('📊 Total de pedidos:', ordersResult.rows[0].count);
    
    const eventsResult = await pool.query('SELECT COUNT(*) as count FROM events');
    console.log('📊 Total de eventos:', eventsResult.rows[0].count);
    
    const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log('📊 Total de usuários:', usersResult.rows[0].count);
    
    // Se não há pedidos, inserir alguns de teste
    if (parseInt(ordersResult.rows[0].count) === 0) {
      console.log('⚠️ Nenhum pedido encontrado. Inserindo dados de teste...');
      
      // Verificar se há usuários e eventos
      if (parseInt(usersResult.rows[0].count) === 0) {
        const newUser = await pool.query(`
          INSERT INTO users (name, email, username, password, role, phone) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, ['Usuário Teste', 'teste@exemplo.com', 'teste', 'senha123', 'user', '11999999999']);
        console.log('✅ Usuário criado:', newUser.rows[0].id);
      }
      
      if (parseInt(eventsResult.rows[0].count) === 0) {
        const newEvent = await pool.query(`
          INSERT INTO events (title, description, date, status, venue_id, room_id) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, ['Evento Teste', 'Evento para testar dashboard', new Date(), 'confirmed', 1, 1]);
        console.log('✅ Evento criado:', newEvent.rows[0].id);
      }
      
      // Buscar IDs para usar nos pedidos
      const user = await pool.query('SELECT id FROM users LIMIT 1');
      const event = await pool.query('SELECT id FROM events LIMIT 1');
      
      if (user.rows.length > 0 && event.rows.length > 0) {
        const userId = user.rows[0].id;
        const eventId = event.rows[0].id;
        
        // Inserir pedidos de teste
        const testOrders = [
          [userId, eventId, 'confirmed', 2500, 25, new Date(), 'Menu Premium', 'Pedido de teste'],
          [userId, eventId, 'pending', 1000, 20, new Date(), 'Menu Coffee Break', 'Pedido pendente'],
          [userId, eventId, 'completed', 3900, 39, new Date(), 'Menu Almoço', 'Pedido concluído']
        ];
        
        for (const orderData of testOrders) {
          const newOrder = await pool.query(`
            INSERT INTO orders (user_id, event_id, status, total_amount, guest_count, date, menu_selection, admin_notes) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING id, status, total_amount
          `, orderData);
          console.log(`✅ Pedido criado: ID=${newOrder.rows[0].id}, Status=${newOrder.rows[0].status}, Valor=${newOrder.rows[0].total_amount}`);
        }
      }
    }
    
    // Verificar novamente
    const finalOrdersResult = await pool.query('SELECT COUNT(*) as count FROM orders');
    console.log('📊 Total final de pedidos:', finalOrdersResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testDatabase(); 