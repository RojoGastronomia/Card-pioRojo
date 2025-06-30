import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

// Definir tipos localmente para evitar problemas de importação
interface OrderStatusStats {
  pending: number;
  confirmed: number;
  completed: number;
}

interface DashboardStats {
  totalEvents: string;
  totalUsers: string;
  totalOrders: string;
  totalRevenue: number;
  confirmedOrdersRevenue: number;
  recentEvents: any[];
  recentOrders: any[];
  eventsPerMonth: any[];
  eventCategories: any[];
  orderStatusStats: OrderStatusStats;
  timestamp: string;
}

export interface SSEStatsHook {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<boolean>;
  isConnected: boolean;
  lastUpdate: Date;
}

// Função para obter a URL base da API
const getApiBaseUrl = (): string => {
  return 'http://localhost:5000';
};

// Hook personalizado para conectar ao SSE e receber atualizações em tempo real
export const useSSEStats = (dateRange?: { start: string; end: string }, autoRefresh: boolean = true): SSEStatsHook => {
  // Estado para armazenar as estatísticas
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Referência para armazenar a instância mais recente da função
  const refreshStatsRef = useRef<() => Promise<boolean>>(async () => false);

  // Processa os dados recebidos e garante que todos os campos necessários existam
  const processStatsData = useCallback((data: any): DashboardStats => {
    console.log('[SSE] processStatsData recebeu:', data);
    
    // Garantir que recentOrders sempre exista como array
    const recentOrders = Array.isArray(data.recentOrders) ? data.recentOrders : [];
    
    // Garantir que valores financeiros sejam sempre números
    const totalRevenue = typeof data.totalRevenue === 'string' 
      ? parseFloat(data.totalRevenue) || 0 
      : Number(data.totalRevenue || 0);
      
    const confirmedOrdersRevenue = typeof data.confirmedOrdersRevenue === 'string' 
      ? parseFloat(data.confirmedOrdersRevenue) || 0 
      : Number(data.confirmedOrdersRevenue || 0);
    
    console.log("[SSE] Processando valores financeiros:", {
      originalTotal: data.totalRevenue,
      parsedTotal: totalRevenue,
      originalPotential: data.confirmedOrdersRevenue,
      parsedPotential: confirmedOrdersRevenue
    });
    
    // Normalizar dados e criar um objeto DashboardStats válido
    const statsData: DashboardStats = {
      totalEvents: data.totalEvents || '0',
      totalUsers: data.totalUsers || '0',
      totalOrders: data.totalOrders || '0',
      totalRevenue: totalRevenue,
      confirmedOrdersRevenue: confirmedOrdersRevenue,
      recentEvents: Array.isArray(data.recentEvents) ? data.recentEvents : [],
      recentOrders: recentOrders,
      eventsPerMonth: data.eventsPerMonth || [],
      eventCategories: data.eventCategories || [],
      orderStatusStats: data.orderStatusStats || data.ordersByStatus || { pending: 0, confirmed: 0, completed: 0 },
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    console.log('[SSE] statsData processado:', {
      totalEvents: statsData.totalEvents,
      totalOrders: statsData.totalOrders,
      recentOrders: statsData.recentOrders.length,
      ordersByStatus: statsData.orderStatusStats
    });
    
    // Verificação final
    if (!statsData.recentOrders || statsData.recentOrders.length === 0) {
      console.warn("[SSE] ALERTA: processStatsData retornando dados sem pedidos recentes!");
    }
    
    return statsData;
  }, []);

  // Função para buscar pedidos garantidos quando necessário
  const fetchGuaranteedOrders = useCallback(async (statsData: any): Promise<DashboardStats> => {
    try {
      console.warn("[SSE] Não há pedidos recentes, tentando buscar pedidos garantidos");
      
      // NÃO buscar pedidos garantidos se há filtro de data ativo
      if (dateRange && dateRange.start && dateRange.end) {
        console.log("[SSE] Filtro de data ativo - NÃO buscando pedidos garantidos");
        console.log("[SSE] Retornando dados filtrados mesmo que vazios");
        return processStatsData(statsData);
      }
      
      const response = await fetch(`${getApiBaseUrl()}/api/orders?forceGuaranteed=true`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar pedidos garantidos: ${response.status}`);
      }
      
      const orders = await response.json();
      console.log("[SSE] Pedidos garantidos obtidos:", orders);
      
      if (orders && orders.length > 0) {
        // Criar uma nova cópia dos dados com os pedidos garantidos
        const updatedStatsData = {
          ...statsData,
          recentOrders: orders,
          // Atualizar totalOrders se necessário
          totalOrders: orders.length.toString()
        };
        
        console.log("[SSE] Dados atualizados com pedidos garantidos");
        return processStatsData(updatedStatsData);
      } else {
        console.warn("[SSE] Não foi possível obter pedidos garantidos");
        return processStatsData(statsData);
      }
    } catch (error) {
      console.error("[SSE] Erro ao buscar pedidos garantidos:", error);
      return processStatsData(statsData);
    }
  }, [processStatsData, dateRange]);

  // Definindo a função refreshStats
  const refreshStats = useCallback(async (): Promise<boolean> => {
    try {
      console.log('[SSE] refreshStats chamado com dateRange:', dateRange);
      console.log('[SSE] dateRange é undefined?', dateRange === undefined);
      console.log('[SSE] dateRange é null?', dateRange === null);
      console.log('[SSE] dateRange.start existe?', !!dateRange?.start);
      console.log('[SSE] dateRange.end existe?', !!dateRange?.end);
      
      setIsLoading(true);
      
      let url = `${getApiBaseUrl()}/api/basic-stats`;
      let params = new URLSearchParams();
      
      // Se há filtro válido, usar o filtro
      if (dateRange && dateRange.start && dateRange.end && dateRange.start !== '' && dateRange.end !== '') {
        params.set('start', dateRange.start);
        params.set('end', dateRange.end);
        console.log('[SSE] Usando filtro:', dateRange);
      } else {
        // Se não há filtro, buscar TODOS os dados (sem filtro de data)
        console.log('[SSE] Sem filtro - buscando todos os dados');
        console.log('[SSE] Não adicionando parâmetros de data à URL');
        // Não adicionar parâmetros de data para buscar todos os dados
      }
      
      params.set('ts', Date.now().toString());
      url += `?${params}`;
      
      console.log('[SSE] URL final:', url);
      console.log('[SSE] Parâmetros:', params.toString());
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[SSE] Dados recebidos:', data);
      console.log('[SSE] Total de eventos recebidos:', data.recentEvents?.length || 0);
      console.log('[SSE] Total de pedidos recebidos:', data.recentOrders?.length || 0);
      
      setLastUpdate(new Date());
      setStats(processStatsData(data));
      setIsLoading(false);
      setIsConnected(true);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('[SSE] Erro:', err);
      setError('Erro ao buscar dados');
      setIsLoading(false);
      setIsConnected(false);
      return false;
    }
  }, [dateRange, processStatsData]);
  
  // Adicionar um timeout de segurança para garantir que loading seja sempre limpo
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        console.warn('[SSE] Timeout de segurança: limpando loading após 10 segundos');
        setIsLoading(false);
      }, 10000);
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);
  
  // Atualizar a referência quando a função refreshStats mudar
  useEffect(() => {
    refreshStatsRef.current = refreshStats;
  }, [refreshStats]);
  
  // Configurar conexão SSE quando o componente for montado e configurar atualização periódica
  useEffect(() => {
    // Primeiro carregamento imediato
    console.log('[SSE] Inicializando e buscando dados iniciais...');
    refreshStats();
    
    // Configurar atualização automática a cada 10 segundos apenas se autoRefresh estiver ativo
    let intervalId: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        console.log('[SSE] Executando atualização automática...');
        // IMPORTANTE: Sempre usar refreshStats que já considera o dateRange atual
        refreshStats();
      }, 10000);
    }
    
    return () => {
      // Limpar intervalo e conexões quando o componente for desmontado
      if (intervalId) {
        clearInterval(intervalId);
      }
      
      if (eventSource) {
        console.log('[SSE] Fechando conexão na limpeza do efeito');
        eventSource.close();
      }
    };
  }, [autoRefresh, refreshStats]);
  
  // Efeito para reagir às mudanças no filtro de data
  useEffect(() => {
    console.log('[SSE] useEffect dateRange mudou:', dateRange);
    // Usar setTimeout para evitar loops infinitos
    const timeoutId = setTimeout(() => {
      refreshStats();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [dateRange, refreshStats]);
  
  // Tentar reconectar se o navegador ficar online novamente
  useEffect(() => {
    const handleOnline = () => {
      if (!eventSource) {
        console.log('Conexão de rede restaurada, reconectando...');
        refreshStatsRef.current();
      }
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [eventSource]);

  return { stats, isLoading, error, refreshStats, isConnected, lastUpdate };
}; 