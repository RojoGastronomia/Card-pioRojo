import { useState, useEffect, useRef, useCallback } from "react";
import { Footer } from "@/components/layout/footer";
import StatsCard from "@/components/admin/stats-card";
import { Navbar } from "@/components/layout/navbar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { 
  Calendar, 
  Users, 
  CalendarCheck, 
  DollarSign, 
  Download, 
  ArrowUp,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { getApiBaseUrl } from "@/lib/queryClient";
import { toast as sonnerToast } from "sonner";
import { useSSEStats } from "@/hooks/use-sse-stats";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { useLanguage } from "@/context/language-context";
import { PieLabelRenderProps } from 'recharts';

// Atualizar as cores do gráfico para serem mais distintas e agradáveis
const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

type DashboardStats = any;

type CustomPieLabelProps = {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  name: string;
};

// Label customizado para o PieChart
const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: CustomPieLabelProps) => {
  if (percent === 0) return null;
  const RADIAN = Math.PI / 180;
  // Calcular posição do label
  const radius = innerRadius + (outerRadius - innerRadius) * 1.15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={16}
      fontWeight={700}
      style={{ pointerEvents: 'none', textShadow: '0 2px 8px #000c' }}
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardPage() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  
  // Função para formatar data sem problemas de timezone
  const formatDateDisplay = useCallback((dateString: string) => {
    // Dividir a data em partes para evitar problemas de timezone
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  }, []);

  // Função para formatar nome do mês
  const formatMonthName = useCallback((dateString: string) => {
    const [year, month] = dateString.split('-');
    const monthIndex = parseInt(month) - 1; // Mês começa em 0 no JavaScript
    const monthNames = [
      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    return `${monthNames[monthIndex]} de ${year}`;
  }, []);

  // Função para obter o filtro padrão do mês atual
  const getCurrentMonthFilter = useCallback(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0-11
    const day = today.getDate();
    
    // Criar data de início do mês (1º dia)
    const startDate = new Date(year, month, 1);
    const startString = startDate.toISOString().split('T')[0];
    
    // Criar data de fim (hoje)
    const endString = today.toISOString().split('T')[0];
    
    console.log('[DashboardPage] getCurrentMonthFilter:', {
      year,
      month,
      day,
      startString,
      endString
    });
    
    return {
      start: startString,
      end: endString
    };
  }, []);
  
  const [dateRange, setDateRange] = useState<{ start: string; end: string; } | undefined>(getCurrentMonthFilter());
  const [chartView, setChartView] = useState("month");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isDataFresh, setIsDataFresh] = useState(false);
  const [lastMonthChecked, setLastMonthChecked] = useState(new Date().getMonth());
  
  // Usar o hook SSE para obter dados em tempo real
  const { stats, isLoading, isConnected, error: sseError, lastUpdate, refreshStats } = useSSEStats(dateRange, autoRefresh) as any;
  
  // Armazenar os dados anteriores para comparar mudanças
  const previousStatsRef = useRef<DashboardStats | null>(null);

  // Efeito para notificar o usuário sobre mudanças nos dados
  useEffect(() => {
    if (lastUpdate) {
      setLastRefresh(lastUpdate);
      setIsDataFresh(true);
      
      // Ocultar indicador de dados novos após 3 segundos
      const timeoutId = setTimeout(() => {
        setIsDataFresh(false);
      }, 3000);
      
      // Verificar se houve mudanças significativas nos dados
      if (previousStatsRef.current) {
        const prev = previousStatsRef.current;
        if (stats && prev) {
          if (stats.totalEvents > prev.totalEvents) {
            sonnerToast.info(`${stats.totalEvents - prev.totalEvents} novo(s) evento(s) adicionado(s)`);
          }
          if (stats.totalOrders > prev.totalOrders) {
            sonnerToast.info(`${stats.totalOrders - prev.totalOrders} novo(s) pedido(s) recebido(s)`);
          }
        }
      }
      
      // Atualizar a referência para a próxima comparação
      if (stats) {
        previousStatsRef.current = stats;
      }
      
      // Cleanup do timeout
      return () => clearTimeout(timeoutId);
    }
  }, [lastUpdate, stats]);

  // Verificar ao carregar o componente
  useEffect(() => {
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent('/admin/dashboard');
      window.location.href = `/auth?returnTo=${returnUrl}`;
      return;
    }

    if (user?.role !== "Administrador") {
      toast({
        title: "Acesso restrito",
        description: "Esta página é apenas para administradores",
        variant: "destructive"
      });
      
      // Redirecionar para página inicial após 3 segundos
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    }
  }, [isAuthenticated, user, toast]);

  // Debug dos dados recebidos
  useEffect(() => {
    if (stats) {
      console.log('[DashboardPage] Total de eventos recentes:', stats.recentEvents.length);
      console.log('[DashboardPage] SUCESSO! Total de pedidos recentes:', stats.recentOrders.length);
      console.log('[DashboardPage] TODOS OS PEDIDOS RECEBIDOS:', stats.recentOrders);
      console.log('[DashboardPage] Estatísticas de status de pedidos:', stats.ordersByStatus);
      console.log('[DashboardPage] Dados de eventos por mês:', stats.eventsPerMonth);
      console.log('[DashboardPage] Dados de categorias de eventos:', stats.eventCategories);
    }
  }, [stats]);

  // Adicionar função para checar se o filtro está no padrão (mês atual)
  const isDefaultDateRange = useCallback(() => {
    if (!dateRange) return false;
    
    const currentFilter = getCurrentMonthFilter();
    return dateRange.start === currentFilter.start && dateRange.end === currentFilter.end;
  }, [dateRange, getCurrentMonthFilter]);

  // Modificar o handleRefresh para alternar entre SSE e fetch manual
  const handleRefresh = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoading) {
      console.log('[DashboardPage] Já está carregando, ignorando refresh');
      return;
    }

    const toastId = sonnerToast.loading(
      dateRange && dateRange.start && dateRange.end 
        ? `${t('admin', 'updatingFilteredData')} (${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)})...`
        : `${t('admin', 'updatingAllData')}...`
    );
    
    try {
      console.log('[DashboardPage] handleRefresh chamado com dateRange:', dateRange);
      if (refreshStats) {
        console.log('[DashboardPage] Chamando refreshStats...');
        await refreshStats();
        console.log('[DashboardPage] refreshStats concluído');
        
        const successMessage = dateRange && dateRange.start && dateRange.end 
          ? t('admin', 'filteredDataUpdated')
          : t('admin', 'allDataUpdated');
          
        sonnerToast.success(successMessage, { id: toastId });
      }
    } catch (error: any) {
      console.error('[DashboardPage] Erro ao atualizar dados via refreshStats:', error);
      sonnerToast.error(t('admin', 'error'), { 
        description: t('admin', 'errorDescription'),
        id: toastId 
      });
    }
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    const newState = !autoRefresh;
    setAutoRefresh(newState);
    if (newState) {
      sonnerToast.success("Atualização automática ativada");
      // Reconectar ao SSE
      window.location.reload();
    } else {
      sonnerToast.info("Atualização automática desativada");
    }
  };

  // Função para limpar filtros
  const handleClearFilters = useCallback(() => {
    console.log('[DashboardPage] Limpando filtros...');
    
    const toastId = sonnerToast.loading(t('admin', 'clearingFilters'));
    
    // Limpar completamente o dateRange
    setDateRange(undefined);
    
    // Aguardar um pouco para garantir que o estado foi atualizado
    setTimeout(() => {
      // Atualizar dados após limpar filtros
    if (refreshStats) {
        console.log('[DashboardPage] Chamando refreshStats após limpar filtros...');
        refreshStats().then(() => {
          console.log('[DashboardPage] refreshStats concluído após limpar filtros');
          sonnerToast.success(t('admin', 'filtersCleared'), { id: toastId });
        }).catch((error: Error) => {
          console.error('[DashboardPage] Erro ao limpar filtros:', error);
          sonnerToast.error(t('admin', 'errorClearingFilters'), { 
            description: error.message,
            id: toastId 
          });
        });
      }
    }, 100); // Pequeno delay para garantir que o estado foi atualizado
  }, [refreshStats]);

  // Debug do dateRange
  useEffect(() => {
    console.log('[DashboardPage] dateRange atualizado:', dateRange);
    console.log('[DashboardPage] dateRange.start:', dateRange?.start);
    console.log('[DashboardPage] dateRange.end:', dateRange?.end);
    console.log('[DashboardPage] dateRange válido:', !!(dateRange && dateRange?.start && dateRange?.end));
    console.log('[DashboardPage] dateRange é undefined?', dateRange === undefined);
    console.log('[DashboardPage] dateRange é null?', dateRange === null);
    console.log('[DashboardPage] dateRange.start é string vazia?', dateRange?.start === '');
    console.log('[DashboardPage] dateRange.end é string vazia?', dateRange?.end === '');
  }, [dateRange]);

  // Verificar se o mês mudou e atualizar o filtro padrão automaticamente
  useEffect(() => {
    const checkMonthChange = () => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      // Se o mês mudou desde a última verificação
      if (currentMonth !== lastMonthChecked) {
        console.log('[DashboardPage] Mês mudou! Atualizando filtro padrão...');
        console.log('[DashboardPage] Mês anterior:', lastMonthChecked, 'Mês atual:', currentMonth);
        
        // Atualizar o mês verificado
        setLastMonthChecked(currentMonth);
        
        // Se o filtro atual é o padrão (mês atual), atualizar para o novo mês
        if (isDefaultDateRange()) {
          const newFilter = getCurrentMonthFilter();
          console.log('[DashboardPage] Atualizando filtro padrão para:', newFilter);
          
          // Notificar o usuário sobre a mudança automática
          sonnerToast.info(
            `${t('admin', 'monthChanged')} ${formatMonthName(newFilter.start)}`,
            { duration: 4000 }
          );
          
          setDateRange(newFilter);
        }
      }
    };
    
    // Verificar a cada minuto se o mês mudou
    const intervalId = setInterval(checkMonthChange, 60000); // 60 segundos
    
    // Verificar imediatamente ao montar o componente
    checkMonthChange();
    
    return () => clearInterval(intervalId);
  }, [lastMonthChecked, isDefaultDateRange]);

  return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{t('admin', 'dashboard')}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-card rounded-lg shadow-sm p-2 border border-border">
              <Input 
                type="date" 
                className="text-sm border-0 focus:ring-0"
                value={dateRange?.start || ''}
                onChange={(e) => setDateRange({...(dateRange || { start: '', end: ''}), start: e.target.value})}
              />
              <span className="mx-2 text-muted-foreground">{t('common', 'to')}</span>
              <Input 
                type="date" 
                className="text-sm border-0 focus:ring-0"
                value={dateRange?.end || ''}
                onChange={(e) => setDateRange({...(dateRange || { start: '', end: ''}), end: e.target.value})}
              />
              <Button 
                variant="default" 
                size="sm" 
                className="ml-2" 
                onClick={handleRefresh}
              >
                {t('admin', 'applyFilter')}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={handleClearFilters}
              >
                {t('admin', 'clearFilters')}
              </Button>
            </div>
            <Button variant="outline" className="gap-2" size="sm">
              <Download size={16} />
              {t('admin', 'exportReport')}
            </Button>
          </div>
        </div>

        {/* Área de status de atualização */}
        <div className={`mb-6 bg-muted/20 rounded-lg p-2 border transition-all duration-300 ${isDataFresh ? "border-green-400 bg-green-50" : !autoRefresh ? "border-yellow-400 bg-yellow-50" : "border-border/30"}`}>
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center text-xs text-muted-foreground py-1 px-2">
                {isConnected ? (
                  <span className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className={`font-medium ${isDataFresh ? "text-green-600" : ""}`}>
                      {isDataFresh ? t('admin', 'dataUpdated') : 'Atualizações em tempo real ativas'}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="font-medium text-red-600">
                      Conexão perdida
                    </span>
                  </span>
                )}
              </div>
              {lastUpdate && (
                <span className="text-xs text-muted-foreground">
                  Última atualização: {lastUpdate.toLocaleTimeString()}
                </span>
              )}
              {!autoRefresh && (
                <span className="ml-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold border border-yellow-300">
                  Atualização automática DESLIGADA
                </span>
              )}
              {/* Indicador de filtro ativo */}
              {dateRange && dateRange.start && dateRange.end && (
                <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold border ${
                  isDefaultDateRange() 
                    ? 'bg-green-100 text-green-800 border-green-300' 
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {isDefaultDateRange() 
                    ? `${t('admin', 'currentMonth')}: ${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)}`
                    : `${t('admin', 'filterActive')}: ${formatDateDisplay(dateRange.start)} - ${formatDateDisplay(dateRange.end)}`
                  }
                </span>
              )}
              {/* Indicador quando não há filtros (mostrando todos os dados) */}
              {(!dateRange || !dateRange.start || !dateRange.end) && (
                <span className="ml-2 px-2 py-1 rounded bg-purple-100 text-purple-800 text-xs font-semibold border border-purple-300">
                  {t('admin', 'allData')}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
                className="gap-2"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                {t('admin', 'refresh')}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleAutoRefresh}
                className={`gap-2 ${autoRefresh ? "bg-muted text-card-foreground border-border" : ""}`}
              >
                {autoRefresh ? <Wifi size={14} /> : <WifiOff size={14} />}
                {autoRefresh ? "Auto" : "Manual"}
              </Button>
            </div>
          </div>
        </div>

        {/* Debug info for development */}
        {sseError && (
          <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <h3 className="text-destructive font-medium">{t('admin', 'connectionError')}:</h3>
            <pre className="text-xs mt-2 text-destructive/80 whitespace-pre-wrap">
              {sseError}
            </pre>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden border border-border/40 hover:border-border/80 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="w-10 h-10 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))
          ) : stats ? (
            <>
              <StatsCard 
                title={t('admin', 'pendingEvents')} 
                value={stats.recentOrders ? stats.recentOrders.filter((order: any) => order.status !== 'completed' && order.status !== 'cancelled').length : 0} 
                icon={<Calendar />} 
                iconBgColor="bg-primary/10" 
                iconColor="text-primary" 
                subtitle={t('admin', 'waitingDelivery')}
              />
              <StatsCard 
                title={t('admin', 'registeredClients')} 
                value={stats.totalUsers || 0} 
                icon={<Users />} 
                iconBgColor="bg-blue-500/10" 
                iconColor="text-blue-500" 
                subtitle={t('admin', 'onlyClientUsers')}
              />
              <StatsCard 
                title={t('admin', 'currentMonthEvents')} 
                value={stats.dashboardTotals?.ordersThisMonth || stats.totalOrders || 0} 
                icon={<CalendarCheck />} 
                iconBgColor="bg-green-500/10" 
                iconColor="text-green-500" 
                subtitle={t('admin', 'totalOrdersThisMonth')}
              />
              <StatsCard 
                title={t('admin', 'revenue')} 
                value={stats.totalRevenue || 0} 
                secondaryValue={stats.confirmedOrdersRevenue || 0} 
                icon={<DollarSign />} 
                iconBgColor="bg-amber-500/10" 
                iconColor="text-amber-500" 
                subtitle={t('admin', 'revenueDescription')}
                showPotential={true}
              />
            </>
          ) : (
            <div className="lg:col-span-4 p-8 text-center">
              <p className="text-muted-foreground">{t('admin', 'couldNotLoadStats')}</p>
              <Button className="mt-4" onClick={handleRefresh}>
                {t('admin', 'tryAgain')}
              </Button>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 overflow-hidden border border-border/40 hover:border-border/70 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
              <CardTitle className="text-lg font-medium">{t('admin', 'ordersByMonth')}</CardTitle>
              <Tabs value={chartView} onValueChange={setChartView}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="month">{t('admin', 'month')}</TabsTrigger>
                  <TabsTrigger value="quarter">{t('admin', 'quarter')}</TabsTrigger>
                  <TabsTrigger value="year">{t('admin', 'year')}</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="pt-4">
              {isLoading ? (
                <Skeleton className="w-full h-[300px]" />
              ) : stats && stats.eventsPerMonth && stats.eventsPerMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.eventsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)'
                      }}
                      formatter={(value, name) => [`${value} ${t('admin', 'orders')}`, t('admin', 'quantity')]}
                      labelFormatter={(label) => `${t('admin', 'month')}: ${label}`}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="#4F46E5" 
                      radius={[4, 4, 0, 0]} 
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    >
                      {stats.eventsPerMonth.map((entry: any, index: any) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-muted-foreground">{t('admin', 'noOrdersByMonth')}</p>
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                      {t('admin', 'updateData')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border/40 hover:border-border/70 transition-colors">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-medium">{t('admin', 'orderStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="w-full h-[300px]" />
              ) : stats && stats.eventCategories && stats.eventCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.eventCategories}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="name"
                      label={renderCustomPieLabel}
                      labelLine={false}
                      animationDuration={1000}
                      animationEasing="ease-in-out"
                    >
                      {stats.eventCategories.map((entry: any, index: any) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={CHART_COLORS[index % CHART_COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)'
                      }}
                      formatter={(value, name, props) => [`${value} ${t('admin', 'orders')}`, props.payload.name]}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      margin={{ top: 20 }}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontWeight: 500 }}>{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center">
                  <p className="text-muted-foreground">{t('admin', 'noOrderStatusData')}</p>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                    {t('admin', 'updateData')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Orders Table Section */}
        <div className="mb-8">
          <Card className="overflow-hidden border border-border/40 hover:border-border/70 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
              <CardTitle className="text-lg font-medium">{t('admin', 'allOrders')} ({stats?.recentOrders?.length || 0})</CardTitle>
              <div className="flex items-center gap-2">
                {stats?.ordersByStatus && (
                  <>
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 font-medium">
                      {t('admin', 'pending')}: {stats.ordersByStatus.pending}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 font-medium">
                      Aguardando Pagamento: {stats.ordersByStatus.aguardandoPagamento}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                      {t('admin', 'confirmed')}: {stats.ordersByStatus.confirmed}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                      {t('admin', 'total')}: {stats.ordersByStatus.total}
                    </span>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="ml-2"
                >
                  {t('admin', 'updateTable')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <div className="p-8 text-center bg-amber-50">
                  <p className="text-amber-700 font-medium">{t('admin', 'noOrdersToDisplay')}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {t('admin', 'backendEmptyOrders')}
                  </p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-4 bg-amber-500 hover:bg-amber-600"
                  >
                    {t('admin', 'tryAgain')}
                  </Button>
                </div>
              )}
              
              <RecentOrdersTable 
                orders={stats?.recentOrders || []} 
                isLoading={isLoading} 
              />
            </CardContent>
          </Card>
        </div>
      </main>
  );
}