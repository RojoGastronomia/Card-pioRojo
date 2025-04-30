import { type Event, type Order } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { toast } from "sonner";
import { useState, useEffect, useCallback, useMemo } from "react";
import { OrderDetailsModal } from "@/components/orders/order-details-modal";
import { PaymentModal } from "@/components/orders/payment-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { LogIn, FileText } from "lucide-react";

const statusConfig = {
  pending: {
    label: "Pendente",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
  },
  confirmed: {
    label: "Confirmado",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 hover:bg-red-100"
  },
  completed: {
    label: "Concluído",
    className: "bg-blue-100 text-blue-800 hover:bg-blue-100"
  }
} as const;

export default function OrderHistoryPage() {
  const { isAuthenticated } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [location, navigate] = useLocation();
  const [hasNewOrder, setHasNewOrder] = useState(false);

  // Only run the query if the user is authenticated
  const ordersQuery = useQuery<Order[]>({
    queryKey: ["/api/orders", { userOnly: true }],
    queryFn: getQueryFn({ on401: "throw" }),
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchOnWindowFocus: true, // Atualiza quando a janela recebe foco
    refetchOnMount: true, // Garante que os dados sejam atualizados quando o componente é montado
    enabled: isAuthenticated // Only run query if user is authenticated
  });

  const eventsQuery = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: isAuthenticated // Only run query if user is authenticated
  });

  // Ordenar os pedidos por ID para garantir correspondência correta
  const orders = useMemo(() => {
    const orderData = ordersQuery.data ?? [];
    // Ordenar os pedidos por ID em ordem decrescente (mais recentes primeiro)
    return [...orderData].sort((a, b) => b.id - a.id);
  }, [ordersQuery.data]);
  
  const events = eventsQuery.data ?? [];

  // Função para obter evento pelo ID
  const getEventById = useCallback((eventId: number) => {
    return events.find((event) => event.id === eventId);
  }, [events]);

  // Forçar atualização dos pedidos quando a página é carregada
  useEffect(() => {
    if (isAuthenticated) {
      console.log("[DEBUG] Forcing orders refresh on page load");
      ordersQuery.refetch();
    }
  }, [isAuthenticated]);

  // Verificar se chegou com parâmetro para mostrar pedido recém-criado
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const newOrder = searchParams.get('newOrder');
    
    if (newOrder === 'true') {
      console.log("[DEBUG] New order detected, refreshing data");
      setHasNewOrder(true);
      
      // Remover o parâmetro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Forçar atualização dos pedidos
      ordersQuery.refetch();
      
      // Exibir toast informativo
      toast.success("Seu pedido foi criado com sucesso!");
    }
  }, [isAuthenticated]);

  // Se há um novo pedido e os dados foram carregados, limpar o flag
  useEffect(() => {
    if (hasNewOrder && !ordersQuery.isLoading && orders.length > 0) {
      setHasNewOrder(false);
    }
  }, [hasNewOrder, ordersQuery.isLoading, orders]);

  const handleOrderClick = (order: Order) => {
    console.log(`[DEBUG] Visualizando detalhes do pedido ID: ${order.id}`);
    
    if (!order || !order.id) {
      console.error('[DEBUG] Pedido inválido ou sem ID:', order);
      toast.error("Erro ao carregar detalhes do pedido");
      return;
    }
    
    // Identificar o pedido correto pelo ID no array de pedidos atual
    // Isso garante que estamos usando os dados mais recentes
    const orderDetails = orders.find(o => o.id === order.id);
    
    if (!orderDetails) {
      console.error(`[DEBUG] Pedido ID ${order.id} não encontrado na lista atualizada`);
      toast.error("Erro ao carregar detalhes do pedido. Tente novamente.");
      return;
    }
    
    console.log(`[DEBUG] Pedido encontrado (ID: ${orderDetails.id}):`, orderDetails);
    
    // Buscar o evento correspondente
    const event = getEventById(orderDetails.eventId);
    
    if (!event) {
      console.error(`[DEBUG] Evento ID ${orderDetails.eventId} não encontrado para o pedido ${orderDetails.id}`);
      toast.error("Evento não encontrado para este pedido.");
      return;
    }
    
    console.log(`[DEBUG] Evento encontrado (ID: ${event.id}):`, event);
    
    // Definir os estados com os dados encontrados
    setSelectedOrder(orderDetails);
    setSelectedEvent(event);
    setShowOrderDetailsModal(true);
  };

  const handlePaymentClick = useCallback((order: Order) => {
    setPaymentOrder(order);
    setShowPaymentModal(true);
  }, []);

  const handlePaymentSuccess = () => {
    toast.success("Pagamento realizado com sucesso! Seu pedido foi confirmado.");
    ordersQuery.refetch();
  };
  
  // Verificar se existe um parâmetro 'pay' na URL
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const searchParams = new URLSearchParams(window.location.search);
    const payOrderId = searchParams.get('pay');
    
    if (payOrderId && orders.length > 0) {
      const orderToPay = orders.find(order => order.id === parseInt(payOrderId));
      if (orderToPay && orderToPay.status === 'pending') {
        handlePaymentClick(orderToPay);
        
        // Limpar o parâmetro da URL para evitar abrir o modal novamente após atualização da página
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [orders, handlePaymentClick, isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md mx-auto">
          <div className="inline-block p-3 bg-primary/10 rounded-full mb-4">
            <FileText size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Faça login para ver seus pedidos</h2>
          <p className="text-gray-600 mb-6">
            Para visualizar seu histórico de pedidos, é necessário entrar na sua conta.
          </p>
          <Button 
            onClick={() => navigate("/auth")} 
            className="w-full flex items-center justify-center"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Entrar na minha conta
          </Button>
        </div>
      </div>
    );
  }

  if (ordersQuery.error) {
    toast.error("Erro ao carregar pedidos");
  }

  if (eventsQuery.error) {
    toast.error("Erro ao carregar eventos");
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Meus Pedidos</h1>
      
      {ordersQuery.isLoading || hasNewOrder ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-gray-500">Carregando seus pedidos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order: Order) => {
            const event = getEventById(order.eventId);
            if (!event) return null;

            const status = statusConfig[order.status as keyof typeof statusConfig] ?? statusConfig.pending;

            return (
              <div
                key={order.id}
                className="bg-white p-6 rounded-lg shadow h-full flex flex-col"
              >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">Pedido #{order.id}</h3>
                      <Badge variant="secondary" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Realizado em {new Date(order.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  </div>

                <div className="space-y-4 flex-grow">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Evento:</p>
                      <p className="line-clamp-1">{event.title}</p>
                    </div>
                    </div>

                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <div>
                      <p className="text-sm text-gray-500">Data:</p>
                      <p>{new Date(order.date).toLocaleString("pt-BR")}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t mt-auto">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                        <p className="text-sm text-gray-500">Tipo de menu</p>
                        <p className="font-medium line-clamp-1">{order.menuSelection}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Convidados</p>
                        <p className="font-medium text-right">{order.guestCount}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mb-4">
                      <p className="font-medium">Total</p>
                      <p className="font-medium text-emerald-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        }).format(order.totalAmount)}
                      </p>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleOrderClick(order)}
                      >
                          Detalhes
                        </Button>
                      {order.status === "pending" && (
                        <Button 
                          className="flex-1"
                          onClick={() => handlePaymentClick(order)}
                        >
                            Efetuar Pagamento
                          </Button>
                        )}
                      </div>
                    </div>
                </div>
              </div>
            );
          })}

          {!ordersQuery.isLoading && orders.length === 0 && (
            <div className="text-center py-8 text-gray-500 col-span-full">
              Nenhum pedido encontrado
            </div>
          )}
        </div>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        event={selectedEvent}
        open={showOrderDetailsModal}
        onOpenChange={(open) => {
          console.log(`[DEBUG] Modal de detalhes ${open ? 'abrindo' : 'fechando'} para pedido ID: ${selectedOrder?.id}`);
          
          // Se estamos abrindo, apenas atualize o estado
          if (open) {
            setShowOrderDetailsModal(true);
            return;
          }
          
          // Se estamos fechando, primeiro atualizar o estado do modal
          setShowOrderDetailsModal(false);
          
          // Então limpamos os dados do pedido após um pequeno atraso
          // para evitar que o conteúdo desapareça durante a animação de fechamento
          setTimeout(() => {
            console.log(`[DEBUG] Limpando dados do pedido após fechamento do modal`);
            setSelectedOrder(null);
            setSelectedEvent(null);
          }, 300);
        }}
      />

      <PaymentModal
        order={paymentOrder}
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}
