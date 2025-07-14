import { storage } from "./storage-mongo";

/**
 * Obtém estatísticas básicas do sistema para o dashboard
 */
export async function getBasicStats(start?: string, end?: string) {
  console.log(`[Stats] ===== INÍCIO DA FUNÇÃO getBasicStats =====`);
  console.log(`[Stats] Parâmetros recebidos: start="${start}", end="${end}"`);
  console.log(`[Stats] Tipo dos parâmetros: start=${typeof start}, end=${typeof end}`);
  
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
    
    // Filtrar por data se fornecido
    let filteredOrders = allOrders;
    let filteredEvents = allEvents;
    let startDate: Date | null = null;
    let endDate: Date | null = null;
    if (start && end) {
      console.log(`[Stats] Filtro de datas recebido: start=${start}, end=${end}`);
      startDate = new Date(start);
      endDate = new Date(end);
      
      // Log das datas de filtro
      console.log(`[Stats] Data de início do filtro: ${startDate.toISOString()}`);
      console.log(`[Stats] Data de fim do filtro: ${endDate.toISOString()}`);
      
      // Log detalhado de cada pedido antes do filtro
      console.log(`[Stats] === PEDIDOS ANTES DO FILTRO ===`);
      allOrders.forEach((order, index) => {
        const orderDate = order.date ? new Date(order.date) : null;
        const orderCreatedAt = order.createdAt ? new Date(order.createdAt) : null;
        console.log(`[Stats] Pedido #${index+1} - ID: ${order.id}, date: ${orderDate?.toISOString() || 'null'}, createdAt: ${orderCreatedAt?.toISOString() || 'null'}`);
      });
      
      filteredOrders = allOrders.filter(order => {
        // USAR DATA DO EVENTO (date) para o filtro, não data de criação
        const orderDate = order.date ? new Date(order.date) : null;
        const isInRange = orderDate && orderDate >= startDate! && orderDate <= endDate!;
        console.log(`[Stats] Pedido ${order.id}: date=${order.date}, createdAt=${order.createdAt}, parsedDate=${orderDate?.toISOString() || 'null'}, inRange=${isInRange}`);
        return isInRange;
      });
      
      // NÃO filtrar eventos por data - sempre mostrar todos os eventos
      // Os eventos são entidades que devem sempre aparecer no dashboard
      filteredEvents = allEvents;
      console.log(`[Stats] Eventos NÃO filtrados por data - mostrando todos os ${allEvents.length} eventos`);
      
      console.log(`[Stats] === RESULTADO DO FILTRO ===`);
      console.log(`[Stats] Total de pedidos antes do filtro: ${allOrders.length}`);
      console.log(`[Stats] Total de pedidos após filtro: ${filteredOrders.length}`);
      console.log(`[Stats] Total de eventos antes do filtro: ${allEvents.length}`);
      console.log(`[Stats] Total de eventos após filtro: ${filteredEvents.length} (todos os eventos sempre mostrados)`);
      
      // Log dos pedidos que passaram no filtro
      if (filteredOrders.length > 0) {
        console.log(`[Stats] Pedidos que passaram no filtro:`);
        filteredOrders.forEach((order, index) => {
          const orderDate = order.date ? new Date(order.date) : null;
          console.log(`[Stats] Pedido filtrado #${index+1} - ID: ${order.id}, date: ${orderDate?.toISOString() || 'null'}`);
        });
      } else {
        console.log(`[Stats] NENHUM pedido passou no filtro de data!`);
      }
    } else {
      console.log(`[Stats] Nenhum filtro de data fornecido - usando todos os dados`);
    }
    
    // Log de pedidos para diagnóstico
    if (filteredOrders.length > 0) {
      console.log(`[Stats] Encontrados ${filteredOrders.length} pedidos REAIS no total`);
      console.log(`[Stats] Detalhes dos pedidos encontrados:`);
      
      // Filtrar pedidos por status
      const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
      const aguardandoPagamentoOrders = filteredOrders.filter(order => order.status === 'aguardando_pagamento');
      const confirmedOrders = filteredOrders.filter(order => order.status === 'confirmed');
      const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled');
      const completedOrders = filteredOrders.filter(order => order.status === 'completed');
      
      console.log(`[Stats] Pedidos pendentes: ${pendingOrders.length}`);
      console.log(`[Stats] Pedidos aguardando pagamento: ${aguardandoPagamentoOrders.length}`);
      console.log(`[Stats] Pedidos confirmados: ${confirmedOrders.length}`);
      console.log(`[Stats] Pedidos cancelados: ${cancelledOrders.length}`);
      console.log(`[Stats] Pedidos concluídos: ${completedOrders.length}`);
      
      // Definir limite para valores anormais
      const MAX_REASONABLE_ORDER_VALUE = 1000000; // 1 milhão como valor máximo razoável
      
      // Log detalhado de cada pedido
      filteredOrders.forEach((order, index) => {
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
    console.log(`[Stats] Todos os ${filteredOrders.length} pedidos encontrados serão exibidos, sem filtros ou limitações`);
    
    // Definir limite para valores anormais
    const MAX_REASONABLE_ORDER_VALUE = 1000000; // 1 milhão como valor máximo razoável
    
    // Log detalhado dos pedidos para diagnóstico
    filteredOrders.forEach((order, index) => {
      // Normalizar valor excessivamente alto para exibição
      const safeValue = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
        MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
        
      console.log(`[Stats] Pedido processado #${index+1} - ID: ${order.id}, EventID: ${order.eventId}, Status: ${order.status || 'N/A'}, Valor: ${order.totalAmount || 0}`);
    });
    
    // Processar pedidos diretamente para evitar problemas de referência
    const processedOrders = filteredOrders.map(order => {
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
    const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
    const aguardandoPagamentoOrders = filteredOrders.filter(order => order.status === 'aguardando_pagamento');
    const confirmedOrders = filteredOrders.filter(order => order.status === 'confirmed');
    const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled');
    const completedOrders = filteredOrders.filter(order => order.status === 'completed');
    
    console.log(`[Stats] Estatísticas de pedidos - pendentes: ${pendingOrders.length}, aguardando pagamento: ${aguardandoPagamentoOrders.length}, confirmados: ${confirmedOrders.length}, cancelados: ${cancelledOrders.length}, concluídos: ${completedOrders.length}`);
    
    // Calcular estatísticas por mês usando dados de PEDIDOS (não eventos)
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Inicializar array de contagem de pedidos por mês (valores zerados)
    const ordersPerMonth = Array(12).fill(0);
    
    // Preencher com dados reais de PEDIDOS
    console.log(`[Stats] Processando distribuição de PEDIDOS por mês para o ano ${currentYear}`);
    filteredOrders.forEach((order) => {
      try {
        // USAR DATA DO EVENTO (date) para distribuição por mês, não data de criação
        if (order.date) {
          // Converter para objeto Date se for string
          const orderDate = typeof order.date === 'string' 
            ? new Date(order.date) 
            : order.date;
            
          if (orderDate.getFullYear() === currentYear) {
            const month = orderDate.getMonth();
            ordersPerMonth[month]++;
            console.log(`[Stats] Pedido ${order.id} contabilizado para o mês ${month+1} (evento em ${orderDate.toISOString()})`);
          } else {
            console.log(`[Stats] Pedido ${order.id} IGNORADO - evento em ${orderDate.getFullYear()} (não é ${currentYear})`);
          }
        } else if (order.createdAt) {
          // Fallback para data de criação se não houver data do evento
          const orderDate = typeof order.createdAt === 'string' 
            ? new Date(order.createdAt) 
            : order.createdAt;
            
          if (orderDate.getFullYear() === currentYear) {
            const month = orderDate.getMonth();
            ordersPerMonth[month]++;
            console.log(`[Stats] Pedido ${order.id} contabilizado para o mês ${month+1} (criado em ${orderDate.toISOString()}) - FALLBACK`);
          }
        } else {
          console.log(`[Stats] Pedido ${order.id} IGNORADO - sem data do evento nem data de criação`);
        }
      } catch (err) {
        console.error(`[Stats] Erro ao processar data do pedido:`, err);
      }
    });
    
    console.log(`[Stats] Distribuição REAL de PEDIDOS por mês: ${ordersPerMonth.join(', ')}`);
    
    // Formatar meses para exibição
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const formattedOrdersPerMonth = monthNames.map((month, index) => ({
      month,
      count: ordersPerMonth[index]
    }));

    console.log(`[Stats] Dados de eventsPerMonth (formattedOrdersPerMonth):`, JSON.stringify(formattedOrdersPerMonth, null, 2));
    
    // Calcular faturamento potencial dos pedidos PENDENTES + CONFIRMADOS
    let potentialPendingOrders: any[] = [];
    let potentialConfirmedOrders: any[] = [];
    if (start && end) {
      // Com filtro: só pedidos dentro do período filtrado
      potentialPendingOrders = filteredOrders.filter(order => order.status === 'pending');
      potentialConfirmedOrders = filteredOrders.filter(order => order.status === 'confirmed');
    } else {
      // Sem filtro: todos os pedidos
      potentialPendingOrders = allOrders.filter(order => order.status === 'pending');
      potentialConfirmedOrders = allOrders.filter(order => order.status === 'confirmed');
    }

    const potentialPendingRevenue = potentialPendingOrders.reduce((total, order) => {
      // Quando há filtro aplicado, considerar todos os pedidos do período
      // Quando não há filtro, aplicar a lógica de "atual ou futuro"
      let shouldInclude = true;
      
      if (!start || !end) {
        // Sem filtro: aplicar lógica de "atual ou futuro"
      let isCurrentOrFutureOrder = false;
      if (order.date) {
        const eventDate = typeof order.date === 'string' ? new Date(order.date) : order.date;
        const eventYear = eventDate.getFullYear();
        const eventMonth = eventDate.getMonth();
          if (eventYear < 2020) return total;
        isCurrentOrFutureOrder = eventYear > currentYear || (eventYear === currentYear && eventMonth >= currentMonth);
      } else if (order.createdAt) {
        const createdDate = typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt;
        const createdYear = createdDate.getFullYear();
        const createdMonth = createdDate.getMonth();
          if (createdYear < 2020) return total;
        isCurrentOrFutureOrder = createdYear > currentYear || (createdYear === currentYear && createdMonth >= currentMonth);
      }
        shouldInclude = isCurrentOrFutureOrder;
      }
      
      if (shouldInclude) {
        const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
          MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
        return total + safeAmount;
      }
      return total;
    }, 0);
    
    const potentialConfirmedRevenue = potentialConfirmedOrders.reduce((total, order) => {
      // Quando há filtro aplicado, considerar todos os pedidos do período
      // Quando não há filtro, aplicar a lógica de "atual ou futuro"
      let shouldInclude = true;
      
      if (!start || !end) {
        // Sem filtro: aplicar lógica de "atual ou futuro"
      let isCurrentOrFutureOrder = false;
      if (order.date) {
        const eventDate = typeof order.date === 'string' ? new Date(order.date) : order.date;
        const eventYear = eventDate.getFullYear();
        const eventMonth = eventDate.getMonth();
          if (eventYear < 2020) return total;
        isCurrentOrFutureOrder = eventYear > currentYear || (eventYear === currentYear && eventMonth >= currentMonth);
      } else if (order.createdAt) {
        const createdDate = typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt;
        const createdYear = createdDate.getFullYear();
        const createdMonth = createdDate.getMonth();
          if (createdYear < 2020) return total;
        isCurrentOrFutureOrder = createdYear > currentYear || (createdYear === currentYear && createdMonth >= currentMonth);
      }
        shouldInclude = isCurrentOrFutureOrder;
      }
      
      if (shouldInclude) {
        const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
          MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
        return total + safeAmount;
      }
      return total;
    }, 0);
    
    const calculatedPotentialRevenue = potentialPendingRevenue + potentialConfirmedRevenue;
    console.log(`[Stats] Faturamento potencial calculado (filtro: ${!!(start && end)}): ${calculatedPotentialRevenue}`);
    console.log(`[Stats] BREAKDOWN - Pendentes: ${potentialPendingRevenue}, Confirmados: ${potentialConfirmedRevenue}`);
    
    // Debug adicional para entender o problema do potencial
    console.log(`[Stats] DEBUG POTENCIAL - Filtro ativo: ${!!(start && end)}`);
    console.log(`[Stats] DEBUG POTENCIAL - Pedidos pendentes totais: ${potentialPendingOrders.length}`);
    console.log(`[Stats] DEBUG POTENCIAL - Pedidos confirmados totais: ${potentialConfirmedOrders.length}`);
    console.log(`[Stats] DEBUG POTENCIAL - Mês atual: ${currentMonth + 1}/${currentYear}`);
    
    if (start && end) {
      console.log(`[Stats] FILTRO ATIVO - Considerando TODOS os pedidos do período filtrado para potencial faturamento`);
    } else {
      console.log(`[Stats] SEM FILTRO - Aplicando lógica de "atual ou futuro" para potencial faturamento`);
    }
    
    // Log detalhado dos pedidos pendentes
    potentialPendingOrders.forEach((order, index) => {
      const orderDate = order.date ? new Date(order.date) : (order.createdAt ? new Date(order.createdAt) : null);
      const isCurrentOrFuture = orderDate ? (
        orderDate.getFullYear() > currentYear || 
        (orderDate.getFullYear() === currentYear && orderDate.getMonth() >= currentMonth)
      ) : false;
      console.log(`[Stats] Pedido pendente ${index + 1}: ID=${order.id}, Data=${orderDate?.toISOString()}, Atual/Futuro=${isCurrentOrFuture}, Valor=${order.totalAmount}`);
    });
    
    // Log detalhado dos pedidos confirmados
    potentialConfirmedOrders.forEach((order, index) => {
      const orderDate = order.date ? new Date(order.date) : (order.createdAt ? new Date(order.createdAt) : null);
      const isCurrentOrFuture = orderDate ? (
        orderDate.getFullYear() > currentYear || 
        (orderDate.getFullYear() === currentYear && orderDate.getMonth() >= currentMonth)
      ) : false;
      console.log(`[Stats] Pedido confirmado ${index + 1}: ID=${order.id}, Data=${orderDate?.toISOString()}, Atual/Futuro=${isCurrentOrFuture}, Valor=${order.totalAmount}`);
    });
    
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
    
    console.log(`[Stats] Categorias de PEDIDOS REAIS - Pendentes: ${pendingOrders.length}, Aguardando Pagamento: ${aguardandoPagamentoOrders.length}, Confirmados: ${confirmedOrders.length}, Cancelados: ${cancelledOrders.length}, Concluídos: ${completedOrders.length}`);
    
    // Formatar dados de categorias de pedidos (valores reais, sem ajustes)
    const orderCategories = [
      { name: "Pendentes", value: pendingOrders.length },
      { name: "Aguardando Pagamento", value: aguardandoPagamentoOrders.length },
      { name: "Confirmados", value: confirmedOrders.length },
      { name: "Cancelados", value: cancelledOrders.length },
      { name: "Concluídos", value: completedOrders.length }
    ];
    
    // Contar pedidos agendados PARA o mês atual (campo 'date')
    const ordersThisMonth = filteredOrders.filter(order => {
      if (!order.date) return false;
      const eventDate = typeof order.date === 'string' ? new Date(order.date) : order.date;
      
      // IGNORAR datas muito antigas (antes de 2020)
      if (eventDate.getFullYear() < 2020) {
        console.log(`[Stats] Pedido ${order.id} IGNORADO em ordersThisMonth - data muito antiga: ${eventDate.getFullYear()}`);
        return false;
      }
      
      // Considerar apenas pedidos confirmados (ou ajuste para o status desejado)
      // return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth && order.status === 'confirmed';
      // Se quiser todos os pedidos agendados para o mês, independente do status, use apenas a linha abaixo:
      return eventDate.getFullYear() === currentYear && eventDate.getMonth() === currentMonth;
    }).length;
    const confirmedRevenue = effectiveConfirmedRevenue; // Usar o valor calculado acima para garantir dados
    
    // Calcular totais filtrados se houver filtro de data
    let dashboardTotalEvents = totalEvents; // Sempre usar o total real de eventos
    let dashboardTotalOrders = totalOrders;
    let dashboardTotalRevenue = effectiveTotalRevenue;
    let dashboardTotalUsers = totalUsers;
    if (start && end) {
      // NÃO alterar o total de eventos - sempre mostrar o total real
      // dashboardTotalEvents = filteredEvents.length; // REMOVIDO - sempre usar totalEvents
      dashboardTotalOrders = filteredOrders.length;
      // Com filtro: calcular receita de TODOS os pedidos do período filtrado
      dashboardTotalRevenue = filteredOrders.reduce((total, order) => {
        const safeAmount = order.totalAmount && order.totalAmount > MAX_REASONABLE_ORDER_VALUE ? 
          MAX_REASONABLE_ORDER_VALUE : (order.totalAmount || 0);
        return total + safeAmount;
      }, 0);
      // Opcional: contar apenas usuários que fizeram pedidos no período
      // dashboardTotalUsers = new Set(filteredOrders.map(o => o.clientId)).size;
    }
    
    console.log(`[Stats] Totais finais do dashboard - Eventos: ${dashboardTotalEvents} (sempre real), Pedidos: ${dashboardTotalOrders}, Receita: ${dashboardTotalRevenue}`);
    
    // Criação do resultado final com todas as estatísticas e timestamp
    const result = {
      totalEvents: dashboardTotalEvents,
      totalUsers: dashboardTotalUsers,
      totalOrders: dashboardTotalOrders,
      totalRevenue: dashboardTotalRevenue, // Usar valor real calculado
      confirmedOrdersRevenue: effectiveConfirmedRevenue, // Usar valor real calculado
      recentEvents: filteredEvents,
      recentOrders: processedOrders,
      ordersByStatus: {
        pending: pendingOrders.length,
        aguardandoPagamento: aguardandoPagamentoOrders.length,
        confirmed: confirmedOrders.length,
        cancelled: cancelledOrders.length,
        completed: completedOrders.length,
        total: filteredOrders.length
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
        aguardandoPagamento: 0,
        confirmed: 0,
        cancelled: 0,
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
        { name: "Aguardando Pagamento", value: 0 },
        { name: "Confirmados", value: 0 },
        { name: "Cancelados", value: 0 },
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