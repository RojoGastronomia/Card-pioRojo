import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/queryClient';
import { toast as sonnerToast } from 'sonner';

// Tipo para categorias de eventos
type EventCategory = {
  name: string;
  value?: number;
  count?: number;
};

// Tipo para os dados do dashboard
export type DashboardStats = {
  totalEvents: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  confirmedOrdersRevenue: number;
  recentEvents: any[]; // Array de eventos cadastrados
  recentOrders: any[]; // Array de pedidos cadastrados
  ordersByStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    total: number;
  };
  eventsPerMonth: { month: string; count: number }[];
  eventCategories: { name: string; value: number }[]; // Nota: utiliza 'value' para compatibilidade com PieChart
  dateFilter?: { startDate: string; endDate: string };
  dashboardTotals?: {
    ordersThisMonth: number;
    confirmedRevenue: number;
  };
  timestamp: string;
  generatedAt?: string;
  error?: string;
};

type SSEStatsHook = {
  stats: DashboardStats | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => void;
  refreshStats: () => Promise<boolean>;
};

/**
 * Hook para consumir dados estatísticos em tempo real via SSE
 * @returns Dados estatísticos e status da conexão
 */
export function useSSEStats(): SSEStatsHook {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Referência para o EventSource
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionAttemptsRef = useRef<number>(0);
  const maxConnectionAttempts = 5;

  // Função para criar a conexão SSE
  const connectToSSE = () => {
    try {
      console.log("[SSE] Iniciando conexão com servidor de eventos...");
      connectionAttemptsRef.current++;
      
      // Limpar conexão existente, se houver
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      
      // Criar nova conexão
      const url = `${getApiBaseUrl()}/api/dashboard-updates`;
      const eventSource = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = eventSource;
      
      // Configurar listeners
      eventSource.addEventListener('connected', handleConnected);
      eventSource.addEventListener('stats-update', handleStatsUpdate);
      eventSource.addEventListener('error', handleError);
      
      return () => {
        console.log("[SSE] Limpando conexão SSE...");
        if (eventSourceRef.current) {
          eventSource.removeEventListener('connected', handleConnected);
          eventSource.removeEventListener('stats-update', handleStatsUpdate);
          eventSource.removeEventListener('error', handleError);
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }
        
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      };
    } catch (err) {
      console.error("[SSE] Erro ao configurar conexão:", err);
      setError(`Erro ao conectar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setIsConnected(false);
      retryConnection();
      return () => {};
    }
  };
  
  // Handler para evento de conexão estabelecida
  const handleConnected = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`[SSE] Conectado ao servidor de eventos: ${data.clientId}`);
      setIsConnected(true);
      setError(null);
      connectionAttemptsRef.current = 0; // Resetar contador de tentativas
      
      // Não precisamos fazer fetch inicial pois receberemos dados logo em seguida
    } catch (err) {
      console.error("[SSE] Erro ao processar evento de conexão:", err);
    }
  };
  
  // Handler para atualização de estatísticas
  const handleStatsUpdate = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      console.log("[SSE] Atualização de dados recebida:", data);
      
      // Log detalhado sobre pedidos para diagnóstico
      console.log("[SSE] Detalhes de pedidos recebidos:", {
        recentOrdersExiste: !!data.recentOrders,
        recentOrdersLength: data.recentOrders?.length || 0,
        recentOrdersAmostra: data.recentOrders?.slice(0, 2) || []
      });
      
      // Se não houver pedidos, tentar recuperar pedidos garantidos
      if (!data.recentOrders || data.recentOrders.length === 0) {
        console.warn("[SSE] ALERTA: Nenhum pedido recebido na atualização SSE");
        
        // Fazer chamada direta para API para obter pedidos garantidos
        fetch(`${getApiBaseUrl()}/api/orders?forceGuaranteed=true`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        .then(response => response.json())
        .then(orders => {
          console.log("[SSE] Pedidos garantidos recuperados via API auxiliar:", orders.length);
          
          // Processar os dados com pedidos garantidos agora
          processStatsData({
            ...data,
            recentOrders: orders
          });
        })
        .catch(err => {
          console.error("[SSE] Falha ao recuperar pedidos garantidos:", err);
          // Mesmo com erro, continuar com os dados disponíveis
          processStatsData(data);
        });
      } else {
        // Continuar com o processamento normal se já temos pedidos
        processStatsData(data);
      }
    } catch (err) {
      console.error("[SSE] Erro ao processar atualização de estatísticas:", err);
      setError(`Erro ao processar dados: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
    }
  };
  
  // Função auxiliar para processar dados de estatísticas
  const processStatsData = (data: any) => {
    // Garantir que recentOrders seja sempre um array
    const recentOrders = Array.isArray(data.recentOrders) ? data.recentOrders : [];
    
    console.log("[SSE] Processando dados de estatísticas com", recentOrders.length, "pedidos");

    // Garantir que os valores financeiros sejam números
    const totalRevenue = typeof data.totalRevenue === 'string' 
      ? parseFloat(data.totalRevenue.replace(/[^\d.-]/g, '')) || 0 
      : Number(data.totalRevenue || 0);
      
    const confirmedOrdersRevenue = typeof data.confirmedOrdersRevenue === 'string' 
      ? parseFloat(data.confirmedOrdersRevenue.replace(/[^\d.-]/g, '')) || 0 
      : Number(data.confirmedOrdersRevenue || 0);
    
    console.log("[SSE] Processando valores financeiros:", {
      originalTotal: data.totalRevenue,
      parsedTotal: totalRevenue,
      originalPotential: data.confirmedOrdersRevenue,
      parsedPotential: confirmedOrdersRevenue
    });
    
    // Normalizar os dados para garantir que todos os campos existam
    const statsData: DashboardStats = {
      totalEvents: data.totalEvents ?? 0,
      totalUsers: data.totalUsers ?? 0,
      totalOrders: data.totalOrders ?? 0,
      totalRevenue: totalRevenue,
      confirmedOrdersRevenue: confirmedOrdersRevenue,
      recentEvents: data.recentEvents || [],
      recentOrders: recentOrders, // Usar pedidos processados
      ordersByStatus: data.ordersByStatus || {
        pending: 0,
        confirmed: 0,
        completed: 0,
        total: 0
      },
      eventsPerMonth: data.eventsPerMonth || [],
      eventCategories: Array.isArray(data.eventCategories) 
        ? data.eventCategories.map((cat: EventCategory) => ({
            name: cat.name,
            value: typeof cat.value !== 'undefined' ? cat.value : (cat.count || 0)
          }))
        : [],
      timestamp: data.timestamp || new Date().toISOString(),
      dashboardTotals: data.dashboardTotals || {
        ordersThisMonth: data.totalOrders || 0,
        confirmedRevenue: data.totalRevenue || 0
      },
      generatedAt: data.generatedAt || new Date().toISOString()
    };
    
    // Verificação final para debug
    if (!statsData.recentOrders || statsData.recentOrders.length === 0) {
      console.warn("[SSE] ALERTA FINAL: Ainda sem pedidos após processamento!");
    } else {
      console.log("[SSE] SUCESSO: Dados processados com", statsData.recentOrders.length, "pedidos");
      console.log("[SSE] Exemplo de pedido processado:", statsData.recentOrders[0]);
    }
    
    setStats(statsData);
    setLastUpdate(new Date());
    setIsLoading(false);
  };
  
  // Handler para erros de conexão
  const handleError = (event: Event) => {
    console.error("[SSE] Erro na conexão SSE:", event);
    setIsConnected(false);
    
    // Tentativa de reconexão com backoff exponencial
    retryConnection();
  };
  
  // Função para tentar reconexão com backoff exponencial
  const retryConnection = () => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    
    // Se excedeu o número máximo de tentativas, parar
    if (connectionAttemptsRef.current >= maxConnectionAttempts) {
      setError("Número máximo de tentativas de conexão excedido. Tente recarregar a página.");
      return;
    }
    
    // Calcular tempo de espera com backoff exponencial (1s, 2s, 4s, 8s, 16s)
    const delay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current - 1), 16000);
    
    console.log(`[SSE] Tentando reconectar em ${delay}ms (tentativa ${connectionAttemptsRef.current}/${maxConnectionAttempts})`);
    
    retryTimeoutRef.current = setTimeout(() => {
      console.log("[SSE] Tentando reconectar...");
      const cleanup = connectToSSE();
      return () => cleanup();
    }, delay);
  };
  
  // Função para solicitar atualização manual (refresh)
  const refresh = () => {
    console.log("[SSE] Solicitando atualização manual");
    
    fetch(`${getApiBaseUrl()}/api/trigger-update`, {
      method: 'POST',
      credentials: 'include'
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log("[SSE] Atualização manual solicitada com sucesso:", data);
      sonnerToast.success("Atualizando dados em tempo real...");
    })
    .catch(err => {
      console.error("[SSE] Erro ao solicitar atualização manual:", err);
      sonnerToast.error("Falha ao solicitar atualização", { 
        description: err.message || "Tente novamente em alguns instantes"
      });
    });
  };

  // Função para forçar uma atualização completa - compatível com dashboard-page.tsx
  const refreshStats = useCallback(async (): Promise<boolean> => {
    console.log('[SSE] Executando refreshStats para atualização forçada');
    setIsLoading(true);
    
    try {
      // Forçar uma atualização dos dados
      const response = await fetch(`${getApiBaseUrl()}/api/basic-stats?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[SSE] Dados atualizados recebidos via fetch direto:', data);
      
      // Processar os dados recebidos
      processStatsData(data);
      setLastUpdate(new Date());
      
      return true;
    } catch (err) {
      console.error('[SSE] Erro ao atualizar dados:', err);
      setError(`Erro ao atualizar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setIsLoading(false);
      return false;
    }
  }, []);
  
  // Iniciar conexão SSE ao montar componente
  useEffect(() => {
    setIsLoading(true);
    const cleanup = connectToSSE();
    
    // Limpar conexão ao desmontar componente
    return cleanup;
  }, []);
  
  return {
    stats,
    isLoading,
    isConnected,
    error,
    lastUpdate,
    refresh,
    refreshStats
  };
} 