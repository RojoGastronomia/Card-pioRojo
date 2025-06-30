import { formatCurrency } from "@/lib/utils";
import { useEffect, useMemo } from "react";
import { useLanguage } from "@/context/language-context";

interface RecentOrder {
  id: number;
  eventId: number;
  eventTitle?: string;
  guestCount: number;
  totalAmount: number;
  status: string;
  date?: string | Date;
  menuSelection?: string;
}

interface RecentOrdersTableProps {
  orders: RecentOrder[];
  isLoading: boolean;
}

// Função auxiliar para formatar data no formato brasileiro
const formatDate = (date: string | Date | undefined): string => {
  if (!date) return "Data não definida";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Verificar se a data é válida
    if (isNaN(dateObj.getTime())) return "Data inválida";
    
    // Formatar como DD/MM/YYYY
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return "Erro na data";
  }
};

export function RecentOrdersTable({ orders, isLoading }: RecentOrdersTableProps) {
  const { t } = useLanguage();

  // Usar useMemo para ordenar os pedidos por data (mais próxima primeiro)
  const sortedOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    
    // Fazer uma cópia para não modificar o array original
    return [...orders].sort((a, b) => {
      // Garantir que temos datas válidas para comparar
      const dateA = a.date ? new Date(a.date) : new Date(9999, 11, 31); // Data distante no futuro
      const dateB = b.date ? new Date(b.date) : new Date(9999, 11, 31);
      
      // Ordenar da data mais próxima para a mais distante
      return dateA.getTime() - dateB.getTime();
    });
  }, [orders]);

  useEffect(() => {
    console.log("[OrdersTable] Componente recebeu pedidos:", { 
      count: orders?.length || 0,
      pedidos: orders?.map(o => `ID:${o.id} Evento:${o.eventId} Data:${o.date} Status:${o.status}`).slice(0, 5)
    });
  }, [orders]);

  if (isLoading) {
    console.log("[OrdersTable] Exibindo estado de carregamento");
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">{t('admin', 'loading')}</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    console.log("[OrdersTable] Nenhum pedido encontrado para exibir");
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">{t('admin', 'noOrdersToDisplay')}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('admin', 'backendEmptyOrders')}
        </p>
      </div>
    );
  }

  console.log("[OrdersTable] Renderizando tabela com", orders.length, "pedidos");

  // Garantir que todos os pedidos tenham valores válidos
  const safeOrders = sortedOrders.map(order => ({
    id: order.id || 0,
    eventId: order.eventId || 0,
    eventTitle: order.eventTitle || `Evento #${order.eventId || 0}`,
    guestCount: order.guestCount || 0,
    totalAmount: order.totalAmount || 0,
    status: order.status || 'pending',
    menuSelection: order.menuSelection || 'Menu Padrão',
    date: order.date || new Date()
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">ID</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">{t('admin', 'date')}</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">{t('admin', 'guests')}</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">{t('admin', 'menu')}</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">{t('admin', 'amount')}</th>
            <th className="py-3 px-4 text-left font-medium text-muted-foreground">{t('admin', 'status')}</th>
          </tr>
        </thead>
        <tbody>
          {safeOrders.map((order, index) => (
            <tr key={`order-${order.id || index}`} className="border-t border-border/30 hover:bg-muted/20">
              <td className="py-3 px-4 font-mono text-xs">{order.id || '—'}</td>
              <td className="py-3 px-4">
                {formatDate(order.date)}
              </td>
              <td className="py-3 px-4">{order.guestCount || 0}</td>
              <td className="py-3 px-4 max-w-[150px] truncate" title={order.menuSelection || 'N/A'}>
                {order.menuSelection || 'N/A'}
              </td>
              <td className="py-3 px-4">{formatCurrency(order.totalAmount || 0)}</td>
              <td className="py-3 px-4">
                <span 
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    order.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800' 
                      : order.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : order.status === 'completed'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {order.status === 'confirmed' 
                    ? t('admin', 'confirmed')
                    : order.status === 'pending'
                    ? t('admin', 'pending')
                    : order.status === 'completed'
                    ? t('admin', 'completed')
                    : t('admin', 'unknown')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="p-4 text-xs text-right text-muted-foreground">
        {t('admin', 'totalOrders')}: {orders.length}
      </div>
    </div>
  );
} 