import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Order, Event, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import { Search, Filter, PencilLine, Calendar, User as UserIcon, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusValue, setOrderStatusValue] = useState<string>("");
  const [adminNotesValue, setAdminNotesValue] = useState("");
  const [isSavingAdminNotes, setIsSavingAdminNotes] = useState(false);

  // Fetch orders
  const { 
    data: orders, 
    isLoading: ordersLoading, 
    isError: ordersError, 
    error: ordersFetchError 
  } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });
  
  // Fetch events
  const { 
    data: events, 
    isError: eventsError, 
    error: eventsFetchError 
  } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });
  
  // Fetch users
  const { 
    data: users, 
    isError: usersError, 
    error: usersFetchError 
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Handle query errors
  useEffect(() => {
    if (ordersError) {
      toast({ title: "Error loading orders", description: ordersFetchError?.message, variant: "destructive" });
    }
    if (eventsError) {
      toast({ title: "Error loading events", description: eventsFetchError?.message, variant: "destructive" });
    }
    if (usersError) {
      toast({ title: "Error loading users", description: usersFetchError?.message, variant: "destructive" });
    }
  }, [ordersError, eventsError, usersError, ordersFetchError, eventsFetchError, usersFetchError, toast]);

  useEffect(() => {
    if (selectedOrder) {
      setAdminNotesValue(selectedOrder.adminNotes || "");
    }
  }, [selectedOrder]);

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number; status: string }) => {
      const res = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowDetailsDialog(false);
      toast({
        title: "Order status updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating order status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Adicionando uma mutation para excluir pedidos
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      console.log(`[DEBUG] Trying to delete order with ID: ${orderId}`);
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      const result = await response.json();
      console.log(`[DEBUG] Order deletion API call completed for ID: ${orderId}. Result:`, result);
      return result;
    },
    onSuccess: (data) => {
      console.log(`[DEBUG] Delete order mutation succeeded, invalidating queries. Response data:`, data);
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Pedido excluído",
        description: `O pedido #${data.orderId} foi excluído com sucesso.`,
        variant: "default",
      });
    },
    onError: (error: Error) => {
      console.error(`[DEBUG] Delete order mutation failed:`, error);
      toast({
        title: "Erro ao excluir pedido",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Helper to get event title by ID
  const getEventTitle = (eventId: number) => {
    const event = events?.find((e: Event) => e.id === eventId);
    return event ? event.title : `ID #${eventId}`;
  };

  // Helper to get user name by ID
  const getUserName = (userId: number) => {
    const user = users?.find((u: User) => u.id === userId);
    return user ? user.name : `ID #${userId}`;
  };

  // Format date
  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800',
    };
    const statusNames: Record<string, string> = {
      'pending': 'Pendente',
      'confirmed': 'Confirmado',
      'cancelled': 'Cancelado',
      'completed': 'Concluído',
    };
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusNames[status] || status}
      </span>
    );
  };

  // Filter orders based on search, status, and date
  const filteredOrders = orders?.filter((order: Order) => {
    const eventTitle = getEventTitle(order.eventId);
    const userName = getUserName(order.userId);
    
    const matchesSearch = 
      eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(order.id).includes(searchTerm);
    
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    const matchesDate = dateFilter ? new Date(order.date).toISOString().split('T')[0] === dateFilter : true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Handle view order details
  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setOrderStatusValue(order.status);
    setShowDetailsDialog(true);
  };

  // Handle order status update
  const handleStatusUpdate = () => {
    if (!selectedOrder || !orderStatusValue) return;
    
    updateOrderStatusMutation.mutate({
      orderId: selectedOrder.id,
      status: orderStatusValue,
    });
  };

  const handleSaveAdminNotes = async () => {
    if (!selectedOrder) return;
    setIsSavingAdminNotes(true);
    try {
      await apiRequest("PUT", `/api/orders/${selectedOrder.id}/admin-notes`, {
        notes: adminNotesValue,
      });
      // Buscar o pedido atualizado do backend
      const updatedOrderRes = await apiRequest("GET", `/api/orders/${selectedOrder.id}`);
      const updatedOrder = await updatedOrderRes.json();
      setSelectedOrder(updatedOrder);
      setAdminNotesValue(""); // Limpa o campo após atualizar o estado
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Observação salva",
        description: "Observação do administrador salva com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar observação",
        description: error instanceof Error ? error.message : "Erro desconhecido.",
        variant: "destructive",
      });
    } finally {
      setIsSavingAdminNotes(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Pedidos</h1>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter(null)}>Todos</TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setStatusFilter("pending")}>Pendentes</TabsTrigger>
          <TabsTrigger value="confirmed" onClick={() => setStatusFilter("confirmed")}>Confirmados</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setStatusFilter("completed")}>Concluídos</TabsTrigger>
          <TabsTrigger value="cancelled" onClick={() => setStatusFilter("cancelled")}>Cancelados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <Input
                type="date"
                value={dateFilter || ""}
                onChange={(e) => setDateFilter(e.target.value || null)}
                className="w-full md:w-auto"
              />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter size={16} />
                    {statusFilter ? statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1) : "Status"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setStatusFilter(null)}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                    Pendente
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("confirmed")}>
                    Confirmado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                    Concluído
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("cancelled")}>
                    Cancelado
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="text"
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {ordersLoading ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Data do Evento</TableHead>
                  <TableHead>N° Convidados</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell>#{order.id}</TableCell>
                    <TableCell>{getUserName(order.userId)}</TableCell>
                    <TableCell>{getEventTitle(order.eventId)}</TableCell>
                    <TableCell>{formatDate(order.date)}</TableCell>
                    <TableCell>{order.guestCount}</TableCell>
                    <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewOrderDetails(order)}
                        >
                          <PencilLine className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir este pedido?')) {
                              deleteOrderMutation.mutate(order.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum pedido encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido #{selectedOrder.id}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                  <div className="mt-1 flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <p className="text-gray-900">{getUserName(selectedOrder.userId)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Evento</h3>
                  <p className="mt-1 text-gray-900">{getEventTitle(selectedOrder.eventId)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data do Evento</h3>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                    <p className="text-gray-900">{formatDate(selectedOrder.date)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Menu Selecionado</h3>
                  <p className="mt-1 text-gray-900">{selectedOrder.menuSelection || "N/A"}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Número de Convidados</h3>
                  <p className="mt-1 text-gray-900">{selectedOrder.guestCount}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valor Total</h3>
                  <p className="mt-1 text-gray-900 font-medium text-primary">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Data do Pedido</h3>
                  <p className="mt-1 text-gray-900">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status do Pedido</h3>
                  <div className="mt-1">
                    <Select
                      value={orderStatusValue}
                      onValueChange={setOrderStatusValue}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Observações do Administrador */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Observações do Administrador</h3>
              {(() => {
                let notesArr = [];
                try {
                  const raw = selectedOrder.adminNotes || '';
                  if (raw.trim().startsWith('[')) {
                    notesArr = JSON.parse(raw);
                  } else if (raw.trim().length > 0) {
                    notesArr = [{ text: raw, author: 'Desconhecido', date: null }];
                  }
                  if (!Array.isArray(notesArr)) notesArr = [];
                } catch {
                  notesArr = [];
                }
                return (
                  <div className="mb-2 space-y-2 max-h-40 overflow-y-auto">
                    {notesArr.length === 0 && (
                      <div className="text-gray-400 italic">Nenhuma observação registrada ainda.</div>
                    )}
                    {notesArr.map((note, idx) => (
                      <div key={idx} className="p-2 bg-gray-100 rounded">
                        <div className="text-gray-800 whitespace-pre-line">{note.text}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {note.author} — {note.date ? new Date(note.date).toLocaleString('pt-BR') : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <textarea
                className="mt-1 w-full min-h-[60px] border rounded-md p-2 text-gray-900"
                value={adminNotesValue}
                onChange={e => setAdminNotesValue(e.target.value)}
                placeholder="Adicione observações administrativas aqui..."
              />
              <Button
                type="button"
                className="mt-2"
                variant="secondary"
                onClick={handleSaveAdminNotes}
                disabled={isSavingAdminNotes}
              >
                {isSavingAdminNotes ? 'Salvando...' : 'Salvar Observação'}
              </Button>
            </div>
            
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
              <Button 
                onClick={handleStatusUpdate}
                disabled={selectedOrder.status === orderStatusValue || updateOrderStatusMutation.isPending}
              >
                {updateOrderStatusMutation.isPending ? "Atualizando..." : "Atualizar Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
