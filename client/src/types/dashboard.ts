export interface DashboardStats {
  totalEvents: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentEvents: Array<{
    id: string;
    name: string;
    date: string;
    clientName: string;
    status: string;
    guests: number;
    value: number;
  }>;
  eventsPerMonth: Array<{
    month: string;
    count: number;
  }>;
  eventCategories: Array<{
    name: string;
    count: number;
  }>;
  timestamp?: string;
  error?: string | null;
  recentOrders?: any[];
  ordersByStatus?: Record<string, number>;
  dashboardTotals?: Record<string, number>;
}

export interface SSEStatsHook {
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refreshStats: () => Promise<boolean>;
} 