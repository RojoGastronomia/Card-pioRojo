import { storage } from "./storage";

/**
 * Obtém estatísticas básicas do sistema para o dashboard
 */
export async function getBasicStats() {
  try {
    console.log(`[Stats] Iniciando obtenção de estatísticas em ${new Date().toISOString()}`);
    const executionId = Math.random().toString(36).substring(2, 10);
    console.log(`[Stats] ID de execução: ${executionId}`);
    
    // Obter contagens totais
    console.log(`[Stats] Buscando totais do sistema...`);
    const totalEventsPromise = storage.getEventCount();
    const totalUsersPromise = storage.getClientCount();
    const totalOrdersPromise = storage.getOrderCount();
    const totalRevenuePromise = storage.getTotalRevenue();
    const potentialRevenuePromise = storage.getPotentialRevenue();
    
    // Buscar todos os eventos do sistema
    console.log(`[Stats] Buscando TODOS os eventos para exibição...`);
    const allEventsPromise = storage.getAllEvents();
    
    // Buscar todos os pedidos do sistema - GARANTIR DADOS REAIS
    console.log(`[Stats] Buscando TODOS os pedidos para exibição...`);
    const allOrdersPromise = storage.getAllOrders();
    
    // Aguardar todas as promessas em paralelo
    const [totalEvents, totalUsers, totalOrders, totalRevenue, potentialRevenue, allEvents, allOrders] = await Promise.all([
      totalEventsPromise, 
      totalUsersPromise,
      totalOrdersPromise, 
      totalRevenuePromise,
      potentialRevenuePromise,
      allEventsPromise,
      allOrdersPromise
    ]);
    
    console.log(`[Stats] TOTAIS REAIS DO BANCO - eventos: ${totalEvents}, clientes: ${totalUsers}, pedidos: ${totalOrders}, receita realizada: ${totalRevenue}, receita potencial: ${potentialRevenue}`);
    
    // Log de cada evento para melhor diagnóstico
    if (allEvents.length > 0) {
      console.log(`[Stats] Encontrados ${allEvents.length} eventos REAIS no total`);
      console.log(`[Stats] Detalhes de TODOS os eventos encontrados:`);
      allEvents.forEach((event, index) => {
        const eventDate = event.createdAt ? new Date(event.createdAt).toISOString() : 'Sem data';
        console.log(`[Stats] Evento #${index+1} - ID: ${event.id}, Nome: "${event.title || 'Sem título'}", Status: ${event.status || 'Sem status'}, Data: ${eventDate}`);
      });
      console.log(`[Stats] Todos os ${allEvents.length} eventos serão usados no dashboard SEM MODIFICAÇÕES`);
    } else {
      console.log(`[Stats] ALERTA: Nenhum evento encontrado no sistema!`);
    }
    
    // Log de pedidos para diagnóstico
    if (allOrders.length > 0) {
      console.log(`[Stats] Encontrados ${allOrders.length} pedidos REAIS no total`);
      console.log(`[Stats] Detalhes dos pedidos encontrados:`);
      
      // Filtrar pedidos por status
      const pendingOrders = allOrders.filter(order => order.status === 'pending');
      const confirmedOrders = allOrders.filter(order => order.status === 'confirmed');
      const completedOrders = allOrders.filter(order => order.status === 'completed');
      
      console.log(`[Stats] Pedidos pendentes: ${pendingOrders.length}`);
      console.log(`[Stats] Pedidos confirmados: ${confirmedOrders.length}`);
      console.log(`[Stats] Pedidos concluídos: ${completedOrders.length}`);
      
      // Definir limite para valores anormais
      const MAX_REASONABLE_ORDER_VALUE = 1000000; // 1 milhão como valor máximo razoável
      
      // Log detalhado de cada pedido
      allOrders.forEach((order, index) => {
        // Detectar valores anormalmente altos
        const isAbnormal = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE;
        const valueDisplay = isAbnormal ? 
          `${order.totalAmount || 0} (VALOR ANORMAL - será limitado para cálculos)` : 
          (order.totalAmount || 0);
          
        console.log(`[Stats] Pedido #${index+1} - ID: ${order.id}, Status: ${order.status || 'N/A'}, EventID: ${order.eventId || 'N/A'}, Valor: ${valueDisplay}`);
      });
    } else {
      console.log(`[Stats] ALERTA: Nenhum pedido encontrado no sistema!`);
    }
    
    // Processar TODOS os pedidos para exibição SEM FILTRAGEM ou ORDENAÇÃO 
    console.log(`[Stats] Todos os ${allOrders.length} pedidos encontrados serão exibidos, sem filtros ou limitações`);
    
    // Definir limite para valores anormais
    const MAX_REASONABLE_ORDER_VALUE = 1000000; // 1 milhão como valor máximo razoável
    
    // Log detalhado dos pedidos para diagnóstico
    allOrders.forEach((order, index) => {
      // Normalizar valor excessivamente alto para exibição
      const safeValue = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
        MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
        
      console.log(`[Stats] Pedido processado #${index+1} - ID: ${order.id}, EventID: ${order.eventId}, Status: ${order.status || 'N/A'}, Valor: ${order.totalAmount || 0}`);
    });
    
    // Processar pedidos diretamente para evitar problemas de referência
    const processedOrders = allOrders.map(order => {
      // Normalizar valor para exibição
      const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
        MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
        
      // Garantir que cada pedido tenha as propriedades necessárias para exibição
      const processedOrder = {
        id: order.id,
        status: order.status || 'pending',
        eventId: order.eventId,
        totalAmount: safeAmount, // Usar valor normalizado
        guestCount: order.guestCount || 0,
        date: order.date || order.createdAt || new Date(),
        eventTitle: `Evento #${order.eventId}`, // Usar ID do evento como identificador
        menuSelection: order.menuSelection || 'Menu Padrão'
      };
      console.log(`[Stats] Pedido preparado para front-end: ID=${processedOrder.id}, EventID=${processedOrder.eventId}, Status=${processedOrder.status}`);
      return processedOrder;
    });
    
    // Confirmar que os dados de pedidos estarão presentes na resposta
    console.log(`[Stats] Total de ${processedOrders.length} pedidos processados e prontos para envio ao frontend`);
    if (processedOrders.length > 0) {
      console.log(`[Stats] Primeiro pedido processado:`, 
        JSON.stringify({
          id: processedOrders[0].id,
          status: processedOrders[0].status,
          eventTitle: processedOrders[0].eventTitle,
          totalAmount: processedOrders[0].totalAmount
        })
      );
    }
    
    // Status de pedidos para o dashboard
    const pendingOrders = allOrders.filter(order => order.status === 'pending');
    const confirmedOrders = allOrders.filter(order => order.status === 'confirmed');
    const completedOrders = allOrders.filter(order => order.status === 'completed');
    
    console.log(`[Stats] Estatísticas de pedidos - pendentes: ${pendingOrders.length}, confirmados: ${confirmedOrders.length}, concluídos: ${completedOrders.length}`);
    
    // Calcular estatísticas por mês usando dados de PEDIDOS (não eventos)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Inicializar array de contagem de pedidos por mês (valores zerados)
    const ordersPerMonth = Array(12).fill(0);
    
    // Preencher com dados reais de PEDIDOS
    console.log(`[Stats] Processando distribuição de PEDIDOS por mês para o ano ${currentYear}`);
    allOrders.forEach((order) => {
      try {
        if (order.createdAt) {
          // Converter para objeto Date se for string
          const orderDate = typeof order.createdAt === 'string' 
            ? new Date(order.createdAt) 
            : order.createdAt;
            
          if (orderDate.getFullYear() === currentYear) {
            const month = orderDate.getMonth();
            ordersPerMonth[month]++;
            console.log(`[Stats] Pedido ${order.id} contabilizado para o mês ${month+1}`);
          }
        }
      } catch (err) {
        console.error(`[Stats] Erro ao processar data do pedido:`, err);
      }
    });
    
    console.log(`[Stats] Distribuição REAL de PEDIDOS por mês: ${ordersPerMonth.join(', ')}`);
    
    // Calcular categorias de pedidos baseado no status
    const pendingCount = pendingOrders.length;
    const confirmedCount = confirmedOrders.length;
    const completedCount = completedOrders.length;
    
    // Calcular faturamento potencial dos pedidos PENDENTES + CONFIRMADOS
    // Com normalização de valores extremos
    const pendingOrdersRevenue = pendingOrders.reduce((total, order) => {
      const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
        MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
      return total + safeAmount;
    }, 0);
    
    const confirmedOrdersRevenue = confirmedOrders.reduce((total, order) => {
      const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
        MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
      return total + safeAmount;
    }, 0);
    
    // Total potencial = pendentes + confirmados
    const calculatedPotentialRevenue = pendingOrdersRevenue + confirmedOrdersRevenue;
    
    console.log(`[Stats] Faturamento potencial calculado: ${calculatedPotentialRevenue} (pendentes: ${pendingOrdersRevenue}, confirmados: ${confirmedOrdersRevenue})`);
    console.log(`[Stats] Faturamento potencial da API: ${potentialRevenue}`);
    
    // Calcular faturamento realizado dos pedidos completados (apenas concluídos)
    const completedOrdersRevenue = completedOrders.reduce((total, order) => {
      const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
        MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
      return total + safeAmount;
    }, 0);
    
    console.log(`[Stats] Faturamento realizado calculado dos pedidos concluídos: ${completedOrdersRevenue}`);
    console.log(`[Stats] Faturamento realizado da API: ${totalRevenue}`);
    
    // Certificar que temos algum valor para exibir no dashboard
    const effectiveTotalRevenue = totalRevenue > 0 ? totalRevenue : completedOrdersRevenue;
    const effectiveConfirmedRevenue = potentialRevenue > 0 ? potentialRevenue : calculatedPotentialRevenue;
    
    console.log(`[Stats] Receita efetiva para exibição - Realizada: ${effectiveTotalRevenue}, Potencial: ${effectiveConfirmedRevenue}`);
    
    console.log(`[Stats] Categorias de PEDIDOS REAIS - Pendentes: ${pendingCount}, Confirmados: ${confirmedCount}, Concluídos: ${completedCount}`);
    
    // Formatar dados de categorias de pedidos (valores reais, sem ajustes)
    const orderCategories = [
      { name: "Pendentes", value: pendingCount },
      { name: "Confirmados", value: confirmedCount },
      { name: "Concluídos", value: completedCount }
    ];
    
    // Formatar meses para exibição
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const formattedOrdersPerMonth = monthNames.map((month, index) => ({
      month,
      count: ordersPerMonth[index]
    }));
    
    // Totais específicos do mês atual para o dashboard
    const ordersThisMonth = ordersPerMonth[currentMonth];
    const confirmedRevenue = effectiveConfirmedRevenue; // Usar o valor calculado acima para garantir dados
    
    // Criação do resultado final com todas as estatísticas e timestamp
    const result = {
      totalEvents,
      totalUsers,
      totalOrders,
      totalRevenue: effectiveTotalRevenue, // Usar valor real calculado
      confirmedOrdersRevenue: effectiveConfirmedRevenue, // Usar valor real calculado
      recentEvents: allEvents,
      recentOrders: processedOrders,
      ordersByStatus: {
        pending: pendingOrders.length,
        confirmed: confirmedOrders.length,
        completed: completedOrders.length,
        total: allOrders.length
      },
      eventsPerMonth: formattedOrdersPerMonth,
      eventCategories: orderCategories,
      dashboardTotals: {
        ordersThisMonth,
        confirmedRevenue
      },
      timestamp: new Date().toISOString(),
      executionId
    };
    
    console.log(`[Stats] Estatísticas geradas com sucesso - ID: ${executionId}`);
    // Log do objeto final para análise
    console.log(`[Stats] Resumo final dos dados que serão enviados:`, {
      totalEvents: result.totalEvents,
      totalOrders: result.totalOrders,
      recentEvents: result.recentEvents.length,
      recentOrders: result.recentOrders.length,
      eventCategories: result.eventCategories.map(c => `${c.name}:${c.value}`).join(', '),
      timestamp: result.timestamp
    });
    
    return result;
  } catch (error) {
    // Em caso de erro, registrar e retornar dados mínimos para não quebrar a interface
    console.error(`[Stats] Erro ao obter estatísticas básicas:`, error);
    
    // Retornar dados mínimos com alerta de erro
    return {
      totalEvents: 0,
      totalUsers: 0,
      totalOrders: 0,
      totalRevenue: 0,
      confirmedOrdersRevenue: 0,
      recentEvents: [],
      recentOrders: [],
      ordersByStatus: {
        pending: 0,
        confirmed: 0,
        completed: 0,
        total: 0
      },
      eventsPerMonth: [
        { month: "Jan", count: 0 },
        { month: "Fev", count: 0 },
        { month: "Mar", count: 0 },
        { month: "Abr", count: 0 },
        { month: "Mai", count: 0 },
        { month: "Jun", count: 0 },
        { month: "Jul", count: 0 },
        { month: "Ago", count: 0 },
        { month: "Set", count: 0 },
        { month: "Out", count: 0 },
        { month: "Nov", count: 0 },
        { month: "Dez", count: 0 }
      ],
      eventCategories: [
        { name: "Pendentes", value: 0 },
        { name: "Confirmados", value: 0 },
        { name: "Concluídos", value: 0 }
      ],
      dashboardTotals: {
        ordersThisMonth: 0,
        confirmedRevenue: 0
      },
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
      isErrorData: true
    };
  }
}