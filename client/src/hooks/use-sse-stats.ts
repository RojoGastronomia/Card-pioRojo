import { useState, useEffect, useRef, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/queryClient';
import { toast as sonnerToast } from 'sonner';
import { API_URL } from '../config';

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
  eventsPerMonth: any[];
  eventCategories: any[];
  dateFilter?: { startDate: string; endDate: string };
  dashboardTotals: {
    ordersThisMonth: number;
    confirmedRevenue: number;
  };
  timestamp: string;
  generatedAt: string;
  error?: string;
};

type SSEStatsHook = {
  stats: DashboardStats | null;
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refreshStats: () => Promise<boolean>;
};

// Classe para gerenciar fila de requisições
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private minInterval = 1000; // 1 segundo entre requisições

  async add<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      if (timeSinceLastRequest < this.minInterval) {
        await new Promise(resolve => 
          setTimeout(resolve, this.minInterval - timeSinceLastRequest)
        );
      }

      const request = this.queue.shift();
      if (request) {
        this.lastRequestTime = now;
        await request();
      }
    }

    this.processing = false;
  }
}

/**
 * Hook para consumir dados estatísticos em tempo real via SSE
 * @returns Dados estatísticos e status da conexão
 */
export function useSSEStats(dateRange?: { start: string; end: string }, autoRefresh: boolean = true): SSEStatsHook {
  console.log('[SSE] Hook chamado com dateRange:', dateRange);
  console.log('[SSE] dateRange.start:', dateRange?.start);
  console.log('[SSE] dateRange.end:', dateRange?.end);
  console.log('[SSE] dateRange é undefined?', dateRange === undefined);
  console.log('[SSE] dateRange.start existe?', !!(dateRange && dateRange.start));
  console.log('[SSE] dateRange.end existe?', !!(dateRange && dateRange.end));
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const isInitialLoadRef = useRef(true);
  const refreshInProgressRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const requestQueueRef = useRef(new RequestQueue());

  // Função para processar os dados recebidos
  const processStatsData = useCallback((data: any): DashboardStats => {
    return {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      generatedAt: data.generatedAt || new Date().toISOString()
    };
  }, []);

  // Função para conectar ao SSE
  const connectToSSE = useCallback(() => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
    }

    // Montar a URL com os filtros de data, se existirem
    let apiUrl = `${getApiBaseUrl()}/api/stats-stream`;
    console.log('[SSE] URL base:', apiUrl);
    console.log('[SSE] dateRange para URL:', dateRange);
    console.log('[SSE] dateRange.start para URL:', dateRange?.start);
    console.log('[SSE] dateRange.end para URL:', dateRange?.end);
    console.log('[SSE] Condição para adicionar filtros:', !!(dateRange && dateRange.start && dateRange.end));
    
    if (dateRange && dateRange.start && dateRange.end) {
      apiUrl += `?start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`;
      console.log('[SSE] Filtros adicionados à URL');
    } else {
      console.log('[SSE] Nenhum filtro adicionado à URL');
    }
    console.log('[SSE] URL final:', apiUrl);

    let loadingTimeout: NodeJS.Timeout | null = null;

    try {
      const eventSource = new EventSource(apiUrl, {
        withCredentials: true
      });
      eventSourceRef.current = eventSource;
      
      eventSource.onopen = () => {
        console.log('[SSE] Conexão estabelecida com sucesso');
        setIsConnected(true);
        setIsLoading(false);
        setError(null);
        reconnectAttemptsRef.current = 0;
        // Timeout para garantir que loading não fique eterno
        loadingTimeout = setTimeout(() => {
          setIsLoading(false);
        }, 5000);
      };

      eventSource.onmessage = (event) => {
        try {
          if (loadingTimeout) clearTimeout(loadingTimeout);
          console.log('[SSE] Mensagem recebida:', event.data);
          const data = JSON.parse(event.data);
          console.log('[SSE] Dados processados:', data);
          console.log('[SSE] DEBUG - Total de pedidos recebidos:', data.totalOrders);
          console.log('[SSE] DEBUG - Pedidos recentes recebidos:', data.recentOrders?.length || 0);
          console.log('[SSE] DEBUG - IDs dos pedidos:', data.recentOrders?.map((o: any) => o.id) || []);
          console.log('[SSE] DEBUG - DateRange atual:', dateRange);
          setStats(processStatsData(data));
          setLastUpdate(new Date());
          setIsLoading(false);
        } catch (err) {
          console.error('[SSE] Erro ao processar mensagem:', err);
          console.error('[SSE] Dados da mensagem:', event.data);
          setError('Erro ao processar dados recebidos');
        }
      };

      eventSource.onerror = (err) => {
        console.error('[SSE] Erro na conexão SSE:', err);
        console.error('[SSE] Estado da conexão:', eventSource.readyState);
        setIsConnected(false);
        setError('Erro na conexão com o servidor');
        
        // Tentar reconectar com backoff exponencial
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`[SSE] Tentando reconectar (tentativa ${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connectToSSE();
          }, delay);
        } else {
          console.error('[SSE] Máximo de tentativas de reconexão atingido');
          sonnerToast.error('Falha na conexão em tempo real', {
            description: 'Não foi possível estabelecer conexão com o servidor. Tente recarregar a página.'
          });
        }
      };
    } catch (err) {
      console.error('[SSE] Erro ao criar EventSource:', err);
      setError('Erro ao criar conexão com o servidor');
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [processStatsData, dateRange]);

  // Função para fazer a requisição HTTP
  const makeRequest = useCallback(async (): Promise<boolean> => {
      let url = `${getApiBaseUrl()}/api/basic-stats?t=${Date.now()}`;
      console.log('[SSE] URL base para fetch:', url);
      console.log('[SSE] dateRange para fetch:', dateRange);
      console.log('[SSE] dateRange.start para fetch:', dateRange?.start);
      console.log('[SSE] dateRange.end para fetch:', dateRange?.end);
      console.log('[SSE] Condição para adicionar filtros no fetch:', !!(dateRange && dateRange.start && dateRange.end));
      
      if (dateRange && dateRange.start && dateRange.end) {
        url += `&start=${encodeURIComponent(dateRange.start)}&end=${encodeURIComponent(dateRange.end)}`;
        console.log('[SSE] Filtros adicionados à URL do fetch');
      } else {
        console.log('[SSE] Nenhum filtro adicionado à URL do fetch');
      }
      console.log('[SSE] URL final do fetch:', url);
      
      console.log('[SSE] Iniciando fetch...');
      const response = await fetch(url, {
        method: 'GET',
      credentials: 'include',
      // Adicionar timeout para evitar requisições pendentes
      signal: AbortSignal.timeout(30000) // 30 segundos de timeout
      });
      
      console.log('[SSE] Response status:', response.status);
      console.log('[SSE] Response ok:', response.ok);
      
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      console.log('[SSE] Fazendo parse da resposta...');
      const data = await response.json();
      console.log('[SSE] Dados atualizados recebidos via fetch direto:', data);
      console.log('[SSE] DEBUG - Total de pedidos recebidos via fetch:', data.totalOrders);
      console.log('[SSE] DEBUG - Pedidos recentes recebidos via fetch:', data.recentOrders?.length || 0);
      console.log('[SSE] DEBUG - IDs dos pedidos via fetch:', data.recentOrders?.map((o: any) => o.id) || []);
      console.log('[SSE] DEBUG - DateRange atual via fetch:', dateRange);
      
      console.log('[SSE] Processando dados...');
      const processedStats = processStatsData(data);
      console.log('[SSE] Dados processados:', processedStats);
      
      console.log('[SSE] Atualizando estado...');
      setStats(processedStats);
      setLastUpdate(new Date());
      setIsLoading(false);
      
      console.log('[SSE] refreshStats concluído com sucesso');
      return true;
  }, [processStatsData, dateRange]);

  // Função para forçar uma atualização completa com fila
  const refreshStats = useCallback(async (): Promise<boolean> => {
    // Verificar se já há uma requisição em andamento
    if (refreshInProgressRef.current) {
      console.log('[SSE] Refresh já em andamento, ignorando chamada');
      return false;
    }

    // Limpar timeout de debounce anterior
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Implementar debouncing para evitar múltiplas chamadas
    return new Promise((resolve) => {
      debounceTimeoutRef.current = setTimeout(async () => {
        refreshInProgressRef.current = true;
        setIsLoading(true);
        
        try {
          console.log('[SSE] Executando refreshStats para atualização forçada');
          
          // Usar a fila de requisições para evitar sobrecarga
          const result = await requestQueueRef.current.add(makeRequest);
          resolve(result);
    } catch (err) {
      console.error('[SSE] Erro ao atualizar dados:', err);
      setError(`Erro ao atualizar: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      setIsLoading(false);
          resolve(false);
        } finally {
          refreshInProgressRef.current = false;
    }
      }, 300); // Debounce de 300ms
    });
  }, [makeRequest]);
  
  // Adicionar um timeout de segurança para garantir que loading seja sempre limpo
  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        console.warn('[SSE] Timeout de segurança: limpando loading após 10 segundos');
        setIsLoading(false);
        refreshInProgressRef.current = false;
      }, 10000);
      
      return () => clearTimeout(safetyTimeout);
    }
  }, [isLoading]);

  // Iniciar conexão SSE ao montar componente
  useEffect(() => {
    console.log('[SSE] useEffect de inicialização executado');
    console.log('[SSE] autoRefresh:', autoRefresh);
    
    // Fazer carregamento inicial via fetch apenas na primeira vez
    if (isInitialLoadRef.current) {
    console.log('[SSE] Fazendo carregamento inicial via fetch...');
      refreshStats().then(success => {
        console.log('[SSE] Carregamento inicial concluído:', success);
        isInitialLoadRef.current = false;
      }).catch(error => {
        console.error('[SSE] Erro no carregamento inicial:', error);
        isInitialLoadRef.current = false;
      });
    }
    
    if (autoRefresh) {
      console.log('[SSE] Iniciando conexão SSE...');
      const cleanup = connectToSSE();
      return cleanup;
    } else {
      console.log('[SSE] Auto-refresh desabilitado, não conectando ao SSE');
      // Se autoRefresh for false, fechar SSE se estiver aberto
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    }
  }, [connectToSSE, autoRefresh]); // Remover refreshStats das dependências

  // Efeito separado para reagir às mudanças no dateRange com debouncing
  useEffect(() => {
    if (autoRefresh && eventSourceRef.current && !isInitialLoadRef.current) {
      // Debounce para reconexão SSE
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        console.log('[SSE] DateRange mudou, reconectando SSE...');
      const cleanup = connectToSSE();
      return cleanup;
      }, 500); // Debounce de 500ms para mudanças de dateRange
    }
  }, [dateRange, connectToSSE, autoRefresh]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    stats,
    isLoading,
    isConnected,
    error,
    lastUpdate,
    refreshStats
  };
} 