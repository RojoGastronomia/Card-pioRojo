import { useState, useEffect, useRef } from "react";
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

// Atualizar as cores do gráfico para serem mais distintas e agradáveis
const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

type DashboardStats = any;

export default function DashboardPage() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [chartView, setChartView] = useState("month");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isDataFresh, setIsDataFresh] = useState(false);
  
  // Usar o hook SSE para obter dados em tempo real
  const { stats, isLoading, isConnected, error: sseError, lastUpdate, refreshStats } = useSSEStats() as any;
  
  // Armazenar os dados anteriores para comparar mudanças
  const previousStatsRef = useRef<DashboardStats | null>(null);

  // Efeito para notificar o usuário sobre mudanças nos dados
  useEffect(() => {
    if (lastUpdate) {
      setLastRefresh(lastUpdate);
      setIsDataFresh(true);
      
      // Ocultar indicador de dados novos após 3 segundos
      setTimeout(() => setIsDataFresh(false), 3000);
      
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
      console.log('[DashboardPage] Dados atualizados recebidos:', stats);
      console.log('[DashboardPage] Timestamp dos dados:', stats.timestamp);
      console.log('[DashboardPage] Contadores principais:', {
        eventos: stats.totalEvents,
        usuarios: stats.totalUsers,
        pedidos: stats.totalOrders,
        receita: stats.totalRevenue,
        faturamentoPotencial: stats.confirmedOrdersRevenue
      });
      
      // Log detalhado do faturamento
      console.log('[DashboardPage] DETALHES DE FATURAMENTO:', {
        totalRevenue: stats.totalRevenue,
        confirmedOrdersRevenue: stats.confirmedOrdersRevenue,
        ordersByStatus: stats.ordersByStatus
      });
      
      if (stats.dashboardTotals) {
        console.log('[DashboardPage] Dashboard totals:', stats.dashboardTotals);
      }
      
      // Detalhar cada evento para debugging
      if (stats.recentEvents && stats.recentEvents.length > 0) {
        console.log('[DashboardPage] Total de eventos recentes:', stats.recentEvents.length);
        stats.recentEvents.forEach((event: any, i: any) => {
          if (i < 3) { // Limitar log para não sobrecarregar
            console.log(`[DashboardPage] Evento ${i+1}:`, {
              id: event.id,
              title: event.title || 'Sem título',
              status: event.status || 'Sem status',
              date: event.createdAt ? new Date(event.createdAt).toISOString() : 'Sem data'
            });
          }
        });
      } else {
        console.log('[DashboardPage] ALERTA: Nenhum evento recebido na resposta!');
      }
      
      // Detalhar dados dos pedidos
      if (stats.recentOrders && stats.recentOrders.length > 0) {
        console.log('[DashboardPage] SUCESSO! Total de pedidos recentes:', stats.recentOrders.length);
        console.log('[DashboardPage] TODOS OS PEDIDOS RECEBIDOS:', stats.recentOrders);
        stats.recentOrders.forEach((order: any, i: any) => {
          console.log(`[DashboardPage] Pedido ${i+1}:`, {
            id: order.id,
            eventId: order.eventId,
            eventTitle: order.eventTitle || `Evento #${order.eventId}`,
            status: order.status || 'Sem status',
            valor: order.totalAmount || 0,
            convidados: order.guestCount || 0
          });
        });
      } else {
        console.log('[DashboardPage] ALERTA: Nenhum pedido recebido na resposta!');
      }
      
      // Detalhar estatísticas de status de pedidos
      if (stats.ordersByStatus) {
        console.log('[DashboardPage] Estatísticas de status de pedidos:', stats.ordersByStatus);
      } else {
        console.log('[DashboardPage] ALERTA: Nenhuma estatística de status de pedidos recebida!');
      }
      
      // Detalhar dados dos gráficos
      if (stats.eventsPerMonth) {
        console.log('[DashboardPage] Dados de eventos por mês:', stats.eventsPerMonth);
      }
      
      if (stats.eventCategories) {
        console.log('[DashboardPage] Dados de categorias de eventos:', stats.eventCategories);
      }
    } else {
      console.log('[DashboardPage] ALERTA: Nenhum dado estatístico recebido!');
    }
  }, [stats]);

  // Manual refresh com feedback visual
  const handleRefresh = () => {
    sonnerToast.loading("Atualizando dados em tempo real...");
    setLastRefresh(new Date());
    
    // Usar o método refreshStats do hook
    console.log('[DashboardPage] Solicitando atualização de dados pelo hook refreshStats');
    
    if (typeof refreshStats === 'function') {
      refreshStats()
        .then((success: any) => {
          if (success) {
            console.log('[DashboardPage] Dados atualizados com sucesso via refreshStats');
            setIsDataFresh(true);
            setTimeout(() => setIsDataFresh(false), 3000);
            sonnerToast.success("Dados atualizados com sucesso");
          } else {
            console.error('[DashboardPage] Falha ao atualizar dados via refreshStats');
            sonnerToast.error("Falha ao atualizar dados");
          }
        })
        .catch((error: any) => {
          console.error('[DashboardPage] Erro ao atualizar dados via refreshStats:', error);
          sonnerToast.error("Erro ao atualizar dados", { description: error?.message });
        });
    } else {
      // Fallback para uma chamada direta de API como alternativa
      console.log('[DashboardPage] refreshStats não disponível, usando fetch direto');
      
      fetch(`${getApiBaseUrl()}/api/basic-stats?t=${Date.now()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      })
      .then(data => {
        console.log('[DashboardPage] Dados atualizados com sucesso via fetch direto');
        
        // Se o hook está disponível mas refreshStats não, tentar atualizar o estado diretamente
        if (stats) {
          console.log('[DashboardPage] Atualizando estado do hook diretamente com dados recebidos');
          // Aqui precisamos presumir que o hook já configurou o estado corretamente
          setIsDataFresh(true);
          setTimeout(() => setIsDataFresh(false), 3000);
        }
        
        sonnerToast.success("Dados atualizados com sucesso");
      })
      .catch(error => {
        console.error('[DashboardPage] Erro ao buscar dados via fetch direto:', error);
        sonnerToast.error("Erro ao atualizar dados", { description: error.message });
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

  return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-card rounded-lg shadow-sm p-2 border border-border">
              <Input 
                type="date" 
                className="text-sm border-0 focus:ring-0"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              />
              <span className="mx-2 text-muted-foreground">até</span>
              <Input 
                type="date" 
                className="text-sm border-0 focus:ring-0"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              />
              <Button 
                variant="default" 
                size="sm" 
                className="ml-2" 
                onClick={handleRefresh}
              >
                Aplicar Filtro
              </Button>
            </div>
            <Button variant="outline" className="gap-2" size="sm">
              <Download size={16} />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {/* Área de status de atualização */}
        <div className={`mb-6 bg-muted/20 rounded-lg p-2 border transition-all duration-300 ${isDataFresh ? "border-green-400 bg-green-50" : "border-border/30"}`}>
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
                      {isDataFresh ? "Dados atualizados!" : "Atualizações em tempo real ativas"}
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center">
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400"></span>
                    </span>
                    <span className="text-red-500">Sem conexão em tempo real</span>
                  </span>
                )}
              </div>
              <div className="flex items-center mr-4">
                {isConnected ? (
                  <span className="flex items-center text-xs text-muted-foreground">
                    <Wifi className="h-3 w-3 mr-1 text-green-500" /> Tempo real
                  </span>
                ) : (
                  <span className="flex items-center text-xs text-muted-foreground">
                    <WifiOff className="h-3 w-3 mr-1 text-red-500" /> Offline
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-mono border-l border-border/50 pl-2">
                Última atualização: <span className="font-medium">{lastRefresh.toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!autoRefresh && (
                <Button 
                  variant="ghost" 
                  onClick={handleRefresh}
                  className="h-8 px-2 text-xs"
                  size="sm"
                >
                  <ArrowUp className="h-3 w-3 mr-1" />
                  Atualizar Agora
                </Button>
              )}
              <Button 
                variant="ghost"
                onClick={toggleAutoRefresh}
                className={`h-8 px-2 text-xs ${autoRefresh ? "text-green-600" : ""}`}
                size="sm"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${autoRefresh && isConnected ? "animate-spin" : ""}`} />
                {autoRefresh ? "Desativar" : "Ativar Auto"}
              </Button>
            </div>
          </div>
        </div>

        {/* Debug info for development */}
        {sseError && (
          <div className="p-4 mb-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <h3 className="text-destructive font-medium">Erro de conexão:</h3>
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
              {console.log('DEBUG - Dashboard Stats:', {
                totalRevenue: stats.totalRevenue,
                confirmedOrdersRevenue: stats.confirmedOrdersRevenue,
                ordersByStatus: stats.ordersByStatus
              })}
              {/* Full stats object for debugging */}
              {console.log('FULL STATS OBJECT:', JSON.stringify(stats, null, 2))}
              
              <StatsCard 
                title="Eventos Pendentes" 
                value={(stats.ordersByStatus?.pending || 0) + (stats.ordersByStatus?.confirmed || 0)} 
                icon={<Calendar />} 
                iconBgColor="bg-primary/10" 
                iconColor="text-primary" 
                subtitle="Aguardando entrega"
              />
              <StatsCard 
                title="Clientes Cadastrados" 
                value={stats.totalUsers || 0} 
                icon={<Users />} 
                iconBgColor="bg-blue-500/10" 
                iconColor="text-blue-500" 
                subtitle="Apenas usuários com função 'cliente'"
              />
              <StatsCard 
                title="Eventos do Mês Atual" 
                value={stats.dashboardTotals?.ordersThisMonth || stats.totalOrders || 0} 
                icon={<CalendarCheck />} 
                iconBgColor="bg-green-500/10" 
                iconColor="text-green-500" 
                subtitle="Total de pedidos registrados no mês corrente"
              />
              
              {/* Direct Card for Revenue/Faturamento */}
              <StatsCard 
                title="Faturamento" 
                value={stats.totalRevenue || 0} 
                secondaryValue={stats.confirmedOrdersRevenue || 0} 
                icon={<DollarSign />} 
                iconBgColor="bg-amber-500/10" 
                iconColor="text-amber-500" 
                subtitle="Realizado (concluído) + Potencial (pendente e confirmado)"
              />
            </>
          ) : (
            <div className="lg:col-span-4 p-8 text-center">
              <p className="text-muted-foreground">Não foi possível carregar os dados estatísticos.</p>
              <Button className="mt-4" onClick={handleRefresh}>
                Tentar novamente
              </Button>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="lg:col-span-2 overflow-hidden border border-border/40 hover:border-border/70 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30">
              <CardTitle className="text-lg font-medium">Pedidos por Mês</CardTitle>
              <Tabs value={chartView} onValueChange={setChartView}>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="month">Mês</TabsTrigger>
                  <TabsTrigger value="quarter">Trimestre</TabsTrigger>
                  <TabsTrigger value="year">Ano</TabsTrigger>
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
                      formatter={(value, name) => [`${value} pedidos`, 'Quantidade']}
                      labelFormatter={(label) => `Mês: ${label}`}
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
                    <p className="text-muted-foreground">Não há dados de pedidos por mês para exibir.</p>
                    <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                      Atualizar Dados
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border/40 hover:border-border/70 transition-colors">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg font-medium">Status dos Pedidos</CardTitle>
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
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
                      formatter={(value, name, props) => [`${value} pedidos`, props.payload.name]}
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
                  <p className="text-muted-foreground">Não há dados de status de pedidos para exibir.</p>
                  <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
                    Atualizar Dados
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
              <CardTitle className="text-lg font-medium">Todos os Pedidos ({stats?.recentOrders?.length || 0})</CardTitle>
                    <div className="flex items-center gap-2">
                {stats?.ordersByStatus && (
                  <>
                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800 font-medium">
                      Pendentes: {stats.ordersByStatus.pending}
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 font-medium">
                      Confirmados: {stats.ordersByStatus.confirmed}
                        </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 font-medium">
                      Total: {stats.ordersByStatus.total}
                      </span>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="ml-2"
                >
                  Atualizar Tabela
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Debug info para identificar problema */}
              {console.log(`[DashboardPage] Enviando ${stats?.recentOrders?.length || 0} pedidos para a tabela`)}
              {stats?.recentOrders && console.log('[DashboardPage] Pedidos disponíveis:', JSON.stringify(stats.recentOrders).substring(0, 500) + '...')}
              
              {/* Verificação adicional para garantir que temos pedidos */}
              {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
                <div className="p-8 text-center bg-amber-50">
                  <p className="text-amber-700 font-medium">Atenção: Não há pedidos para exibir</p>
                  <p className="text-xs text-amber-600 mt-1">
                    O backend está retornando array vazio ou nulo para pedidos.
                  </p>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={handleRefresh}
                    className="mt-4 bg-amber-500 hover:bg-amber-600"
                  >
                    Tentar Novamente
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