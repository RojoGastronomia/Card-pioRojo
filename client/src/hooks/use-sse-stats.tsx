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
  // Usar a URL base do ambiente se disponível, senão usar localhost
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3333';
};

// Hook personalizado para conectar ao SSE e receber atualizações em tempo real
export const useSSEStats = (): SSEStatsHook => {
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
      orderStatusStats: data.orderStatusStats || { pending: 0, confirmed: 0, completed: 0 },
      timestamp: data.timestamp || new Date().toISOString()
    };
    
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
  }, [processStatsData]);

  // Definindo a função refreshStats
  const refreshStats = useCallback(async (): Promise<boolean> => {
    console.log('[SSE] Atualizando estatísticas...');
    setIsLoading(true);
    
    // Fechar conexão existente, se houver
    if (eventSource) {
      console.log('[SSE] Fechando conexão existente');
      eventSource.close();
    }

    // URL do SSE
    const apiUrl = `${getApiBaseUrl()}/api/stats-stream`;
    console.log('[SSE] Conectando ao endpoint:', apiUrl);
    
    try {
      const newEventSource = new EventSource(apiUrl);
      setEventSource(newEventSource);
      
      newEventSource.onopen = () => {
        console.log('[SSE] Conexão estabelecida');
        setIsLoading(false);
        setIsConnected(true);
      };
      
      newEventSource.onmessage = async (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log('[SSE] Atualização de dados recebida:', parsedData);
          setLastUpdate(new Date());
          
          // Verificar existência de pedidos recentes
          if (!parsedData.recentOrders || parsedData.recentOrders.length === 0) {
            // Buscar pedidos garantidos se não houver pedidos
            const enhancedData = await fetchGuaranteedOrders(parsedData);
            setStats(enhancedData);
          } else {
            // Processar normalmente se já houver pedidos
            console.log("[SSE] Pedidos recentes encontrados:", parsedData.recentOrders.length);
            setStats(processStatsData(parsedData));
          }
          
          setIsLoading(false);
          setIsConnected(true);
        } catch (err) {
          console.error('[SSE] Erro ao processar mensagem:', err);
          setError('Erro ao processar dados recebidos');
        }
      };
      
      newEventSource.onerror = (err) => {
        console.error('[SSE] Erro na conexão SSE:', err);
        setError('Falha na conexão com o servidor de eventos');
        setIsLoading(false);
        setIsConnected(false);
        
        // Fechar e tentar reconectar
        newEventSource.close();
        setEventSource(null);
      };
      
      setError(null);
      return true;
    } catch (err) {
      console.error('[SSE] Erro ao iniciar conexão:', err);
      setError('Não foi possível conectar ao servidor');
      setIsLoading(false);
      return false;
    }
  }, [eventSource, fetchGuaranteedOrders, processStatsData]);
  
  // Atualizar a referência quando a função refreshStats mudar
  useEffect(() => {
    refreshStatsRef.current = refreshStats;
  }, [refreshStats]);
  
  // Configurar conexão SSE quando o componente for montado e configurar atualização periódica
  useEffect(() => {
    // Primeiro carregamento imediato
    console.log('[SSE] Inicializando e buscando dados iniciais...');
    refreshStats();
    
    // Configurar atualização automática a cada 10 segundos
    const intervalId = setInterval(() => {
      console.log('[SSE] Executando atualização automática...');
      refreshStatsRef.current();
    }, 10000);
    
    return () => {
      // Limpar intervalo e conexões quando o componente for desmontado
      clearInterval(intervalId);
      
      if (eventSource) {
        console.log('[SSE] Fechando conexão na limpeza do efeito');
        eventSource.close();
      }
    };
  }, [refreshStats, eventSource]);
  
  // Tentar reconectar se o navegador ficar online novamente
  useEffect(() => {
    const handleOnline = () => {
      if (!eventSource) {
        toast.info('Conexão de rede restaurada, reconectando...');
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