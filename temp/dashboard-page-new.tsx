import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Footer } from "@/components/layout/footer";
import StatsCard from "@/components/admin/stats-card";
import { Navbar } from "@/components/layout/navbar";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Users, 
  CalendarCheck, 
  DollarSign, 
  Download, 
  ArrowUp 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getQueryFn, getApiBaseUrl } from "@/lib/queryClient";

// Define stats type
type DashboardStats = {
  totalEvents: number;
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  recentEvents: any[];
  eventsPerMonth: { month: string; count: number }[];
  eventCategories: { name: string; count: number }[];
};

const CHART_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

export default function DashboardPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [chartView, setChartView] = useState("month");
  
  // Armazenar os dados anteriores para comparar mudanças
  const previousStatsRef = useRef<DashboardStats | null>(null);

  const { data: stats, isLoading, refetch, isError } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
    refetchInterval: 5000, // Atualização a cada 5 segundos
    refetchOnWindowFocus: true, // Atualizar ao focar a página
    staleTime: 3000, // Considerar dados "velhos" após 3 segundos
    retry: 3, // Tentar 3 vezes antes de considerar erro
    retryDelay: 500, // Esperar 500ms entre tentativas
    queryFn: getQueryFn({ on401: "throw" })
  });

  // Efeito para detectar mudanças nos dados e mostrar notificações
  useEffect(() => {
    if (stats && previousStatsRef.current) {
      const previous = previousStatsRef.current;
      
      // Verificar se houve novos pedidos
      if (stats.totalOrders > previous.totalOrders) {
        const newOrders = stats.totalOrders - previous.totalOrders;
        toast({
          title: `${newOrders} ${newOrders === 1 ? 'novo pedido' : 'novos pedidos'} recebido${newOrders === 1 ? '' : 's'}!`,
          description: "O dashboard foi atualizado com os dados mais recentes.",
        });
      }
      
      // Verificar se houve mudança na receita
      if (stats.totalRevenue > previous.totalRevenue) {
        toast({
          title: "Receita atualizada",
          description: `Nova receita total: ${formatCurrency(stats.totalRevenue)}`,
        });
      }
    }
    
    // Atualizar a referência para a próxima comparação
    if (stats) {
      previousStatsRef.current = stats;
    }
  }, [stats, toast]);

  const handleRefresh = () => {
    toast({
      title: "Atualizando dashboard",
      description: "Buscando dados mais recentes..."
    });
    refetch();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            className="gap-2"
          >
            <ArrowUp className="h-4 w-4" />
            Atualizar
          </Button>
          <div className="flex items-center bg-white rounded-lg shadow-sm p-2">
            <Input 
              type="date" 
              className="text-sm border-0 focus:ring-0"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="mx-2 text-gray-400">até</span>
            <Input 
              type="date" 
              className="text-sm border-0 focus:ring-0"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Download size={16} />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
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
              title="Total de Eventos" 
              value={stats.totalEvents} 
              icon={<Calendar />} 
              change={12} 
              iconBgColor="bg-primary/10" 
              iconColor="text-primary" 
            />
            <StatsCard 
              title="Participantes Ativos" 
              value={stats.totalUsers} 
              icon={<Users />} 
              change={8} 
              iconBgColor="bg-secondary/10" 
              iconColor="text-secondary" 
            />
            <StatsCard 
              title="Eventos do Mês" 
              value={stats.totalOrders} 
              icon={<CalendarCheck />} 
              change={15} 
              iconBgColor="bg-info/10" 
              iconColor="text-info" 
            />
            <StatsCard 
              title="Faturamento" 
              value={formatCurrency(stats.totalRevenue)} 
              icon={<DollarSign />} 
              change={15} 
              iconBgColor="bg-success/10" 
              iconColor="text-success" 
            />
          </>
        ) : null}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">Eventos por Categoria</CardTitle>
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
            ) : stats ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.eventsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-medium">Distribuição de Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full h-[300px]" />
            ) : stats ? (
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
                    dataKey="count"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats.eventCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Próximos Eventos</CardTitle>
          <Button variant="link" className="p-0">Ver todos</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-40 mb-1" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats && stats.recentEvents.length > 0 ? (
            <div className="space-y-4">
              {stats.recentEvents.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${index % 2 === 0 ? 'bg-indigo-100' : 'bg-green-100'} rounded-full flex items-center justify-center`}>
                      <span className={`${index % 2 === 0 ? 'text-indigo-600' : 'text-green-600'} font-medium`}>
                        {new Date(event.date).getDate()}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500">
                        {new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Não há eventos próximos para exibir.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
} 