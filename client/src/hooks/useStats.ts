import { useState, useCallback } from 'react';
import { getApiBaseUrl } from '@/lib/queryClient';
import { DashboardStats } from '@/types/dashboard';
import { API_URL } from '../config';

/**
 * Hook para buscar estatísticas do dashboard
 */
export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching dashboard statistics...');
      const response = await fetch(`${API_URL}/api/basic-stats`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received dashboard data:', data);
      setStats(data);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setError('Failed to load statistics');
      setIsLoading(false);
      return false;
    }
  }, []);

  return {
    stats,
    isLoading,
    error,
    refreshStats: fetchStats,
    setStats
  };
} 