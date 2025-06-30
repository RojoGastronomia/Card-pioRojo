import { db } from '../db/db.js';
import { orders, events, users } from 'shared/schema.js';

async function checkDashboardData() {
  try {
    console.log('=== VERIFICANDO DADOS DO DASHBOARD ===');
    
    // Verificar usuários
    const allUsers = await db.select().from(users);
    console.log(`📊 Usuários no banco: ${allUsers.length}`);
    if (allUsers.length > 0) {
      console.log('Exemplo de usuário:', allUsers[0]);
    }
    
    // Verificar eventos
    const allEvents = await db.select().from(events);
    console.log(`📊 Eventos no banco: ${allEvents.length}`);
    if (allEvents.length > 0) {
      console.log('Exemplo de evento:', allEvents[0]);
    }
    
    // Verificar pedidos
    const allOrders = await db.select().from(orders);
    console.log(`📊 Pedidos no banco: ${allOrders.length}`);
    if (allOrders.length > 0) {
      console.log('Exemplo de pedido:', allOrders[0]);
    }
    
    // Se não há dados, inserir dados de teste
    if (allOrders.length === 0) {
      console.log('⚠️ Nenhum pedido encontrado. Inserindo dados de teste...');
      
      // Inserir usuário de teste se não existir
      if (allUsers.length === 0) {
        const [newUser] = await db.insert(users).values({
          name: 'Usuário Teste',
          email: 'teste@exemplo.com',
          username: 'teste',
          password: 'senha123',
          role: 'user',
          phone: '11999999999'
        }).returning();
        console.log('✅ Usuário de teste criado:', newUser.id);
      }
      
      // Inserir evento de teste se não existir
      if (allEvents.length === 0) {
        const [newEvent] = await db.insert(events).values({
          title: 'Evento Teste Dashboard',
          description: 'Evento para testar o dashboard',
          date: new Date(),
          status: 'confirmed',
          venueId: 1,
          roomId: 1
        }).returning();
        console.log('✅ Evento de teste criado:', newEvent.id);
      }
      
      // Inserir pedidos de teste
      const userId = allUsers.length > 0 ? allUsers[0].id : 1;
      const eventId = allEvents.length > 0 ? allEvents[0].id : 1;
      
      const testOrders = [
        {
          userId: userId,
          eventId: eventId,
          status: 'confirmed',
          totalAmount: 2500,
          guestCount: 25,
          date: new Date(),
          menuSelection: 'Menu Premium',
          adminNotes: 'Pedido de teste para dashboard'
        },
        {
          userId: userId,
          eventId: eventId,
          status: 'pending',
          totalAmount: 1000,
          guestCount: 20,
          date: new Date(),
          menuSelection: 'Menu Coffee Break',
          adminNotes: 'Pedido pendente de teste'
        },
        {
          userId: userId,
          eventId: eventId,
          status: 'completed',
          totalAmount: 3900,
          guestCount: 39,
          date: new Date(),
          menuSelection: 'Menu Almoço Executivo',
          adminNotes: 'Pedido concluído de teste'
        }
      ];
      
      for (const orderData of testOrders) {
        const [newOrder] = await db.insert(orders).values(orderData).returning();
        console.log(`✅ Pedido de teste criado: ID=${newOrder.id}, Status=${newOrder.status}, Valor=${newOrder.totalAmount}`);
      }
      
      console.log('✅ Dados de teste inseridos com sucesso!');
    } else {
      console.log('✅ Dados já existem no banco. Dashboard deve funcionar normalmente.');
    }
    
    // Verificar novamente após inserção
    const finalOrders = await db.select().from(orders);
    console.log(`📊 Total final de pedidos: ${finalOrders.length}`);
    
    // Mostrar estatísticas
    const confirmedOrders = finalOrders.filter(o => o.status === 'confirmed');
    const pendingOrders = finalOrders.filter(o => o.status === 'pending');
    const completedOrders = finalOrders.filter(o => o.status === 'completed');
    
    console.log('📈 Estatísticas dos pedidos:');
    console.log(`  - Confirmados: ${confirmedOrders.length}`);
    console.log(`  - Pendentes: ${pendingOrders.length}`);
    console.log(`  - Concluídos: ${completedOrders.length}`);
    
    const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const potentialRevenue = [...confirmedOrders, ...pendingOrders].reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    console.log(`💰 Receita realizada: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`💰 Receita potencial: R$ ${potentialRevenue.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  } finally {
    process.exit(0);
  }
}

checkDashboardData(); 