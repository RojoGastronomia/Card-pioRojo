import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseRealtimeUpdatesOptions {
  // Chaves de query para invalidar periodicamente
  queryKeys: string[];
  // Intervalo em ms para verificar atualizações (padrão: 3000ms)
  pollingInterval?: number;
  // Se deve continuar verificando quando a janela não está em foco (padrão: false)
  pollingInBackground?: boolean;
  // Se está habilitado (padrão: true)
  enabled?: boolean;
}

/**
 * Hook para fornecer atualizações em tempo real para queries específicas
 * através de polling automático.
 */
export function useRealtimeUpdates({
  queryKeys,
  pollingInterval = 3000,
  pollingInBackground = false,
  enabled = true
}: UseRealtimeUpdatesOptions) {
  const queryClient = useQueryClient();
  const lastRefreshRef = useRef<Date>(new Date());
  
  // Controlador para verificar se a página está em foco
  const isPageFocused = useRef(typeof document !== 'undefined' ? !document.hidden : true);
  
  // Ouvir eventos de visibilidade da página
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    const handleVisibilityChange = () => {
      isPageFocused.current = !document.hidden;
      
      // Se a página acabou de ganhar foco, forçar uma atualização imediata
      if (isPageFocused.current) {
        queryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
        lastRefreshRef.current = new Date();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [queryClient, queryKeys]);
  
  // Configurar o polling automático
  useEffect(() => {
    if (!enabled) return;
    
    const interval = setInterval(() => {
      // Verificar se devemos fazer polling quando a página está em segundo plano
      if (!pollingInBackground && !isPageFocused.current) {
        return;
      }
      
      // Invalidar todas as queries especificadas
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      
      lastRefreshRef.current = new Date();
    }, pollingInterval);
    
    return () => clearInterval(interval);
  }, [queryClient, queryKeys, pollingInterval, pollingInBackground, enabled]);
  
  // Retornar informações úteis sobre o estado do polling
  return {
    lastRefresh: lastRefreshRef.current,
    isPageFocused: isPageFocused.current,
    forceRefresh: () => {
      queryKeys.forEach(key => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      lastRefreshRef.current = new Date();
    }
  };
} 