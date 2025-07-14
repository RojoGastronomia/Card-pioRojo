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
  DialogDescription,
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
import { Search, Filter, PencilLine, Calendar, User as UserIcon, Trash2, Upload, FileText, X, ExternalLink } from "lucide-react";
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
import { useLanguage } from "@/context/language-context";

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderStatusValue, setOrderStatusValue] = useState("");
  const [adminNotesValue, setAdminNotesValue] = useState("");
  const [isSavingAdminNotes, setIsSavingAdminNotes] = useState(false);
  const [selectedBoletoFile, setSelectedBoletoFile] = useState<File | null>(null);
  const [boletoUploadProgress, setBoletoUploadProgress] = useState(0);
  const { t } = useLanguage();

  // Fetch orders
  const { 
    data: orders, 
    isLoading: ordersLoading, 
    isError: ordersError, 
    error: ordersFetchError,
    refetch: refetchOrders
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
    const statusConfig = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'aguardando_pagamento': 'bg-orange-100 text-orange-800',
      'confirmed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'completed': 'bg-blue-100 text-blue-800',
    };

    const statusLabels = {
      'pending': 'Pendente',
      'aguardando_pagamento': 'Aguardando Pagamento',
      'confirmed': 'Confirmado',
      'cancelled': 'Cancelado',
      'completed': 'Concluído',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig[status as keyof typeof statusConfig] || statusConfig.pending}`}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  // Filtro para eventos pendentes (aguardando entrega)
  const pendingDeliveryOrders = orders?.filter((order: Order) => order.status !== 'completed' && order.status !== 'cancelled');

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
    setSelectedBoletoFile(null);
    setBoletoUploadProgress(0);
    setOrderStatusValue(order.status);
    setShowDetailsDialog(true);
  };

  // Handle order status update
  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    try {
      let updatedOrder = selectedOrder;

      // Se há um boleto selecionado, fazer upload primeiro
      if (selectedBoletoFile) {
        await handleBoletoUpload();
      }

      // Atualizar status do pedido
      const newStatus = selectedBoletoFile ? "aguardando_pagamento" : orderStatusValue;
      
      const response = await apiRequest("PUT", `/api/orders/${selectedOrder.id}/status`, {
        status: newStatus,
        adminNotes: adminNotesValue
      });

      if (response.ok) {
        const result = await response.json();
        setSelectedOrder(result);
        setOrderStatusValue(result.status);
        setAdminNotesValue("");
        
        // Atualizar a lista de pedidos
        queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
        
        toast({
          title: "Status atualizado",
          description: selectedBoletoFile 
            ? "Boleto enviado e status alterado para 'Aguardando Pagamento'" 
            : "Status do pedido atualizado com sucesso",
        });
        
        setShowDetailsDialog(false);
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("[Status Update] Erro:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrderMutation.mutateAsync(Number(orderId));
      toast({
        title: t('admin', 'orderDeleted'),
        description: t('admin', 'orderDeletedSuccess'),
      });
    } catch (error) {
      toast({
        title: t('admin', 'deleteError'),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
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
        title: t('admin', 'notesSaved'),
        description: t('admin', 'notesSavedSuccess'),
      });
    } catch (error) {
      toast({
        title: t('admin', 'saveNotesError'),
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    } finally {
      setIsSavingAdminNotes(false);
    }
  };

  const handleBoletoUpload = async () => {
    if (!selectedBoletoFile || !selectedOrder) return;

    try {
      console.log("Fazendo upload do boleto...");
      console.log("Arquivo selecionado:", selectedBoletoFile);
      console.log("Nome do arquivo:", selectedBoletoFile.name);
      console.log("Tamanho do arquivo:", selectedBoletoFile.size);
      console.log("Tipo do arquivo:", selectedBoletoFile.type);
      
      const formData = new FormData();
      formData.append("boleto", selectedBoletoFile);
      
      console.log("FormData criado, verificando conteúdo:");
      for (let [key, value] of formData.entries()) {
        console.log(`FormData key: ${key}, value:`, value);
      }

      const response = await fetch(`http://localhost:5000/api/orders/${selectedOrder.id}/upload-boleto`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      console.log("Resposta do servidor:", response.status, response.statusText);
      console.log("Headers da requisição enviados:", {
        'Content-Type': 'multipart/form-data',
        'Content-Length': formData.get('boleto') ? 'present' : 'missing'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro detalhado:", errorData);
        throw new Error(errorData.message || 'Erro no upload do boleto');
      }

      const uploadResponse = await response.json();
      console.log("Upload bem-sucedido:", uploadResponse);
      setSelectedOrder(uploadResponse);
      setSelectedBoletoFile(null);
      setBoletoUploadProgress(0);
      
      toast({
        title: "Sucesso!",
        description: "Boleto enviado com sucesso!",
      });
      
      refetchOrders();
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar boleto",
        variant: "destructive",
      });
    }
  };

  const statusLabels = {
    'pending': t('admin', 'statusPending'),
    'processing': t('admin', 'statusProcessing'),
    'completed': t('admin', 'statusCompleted'),
    'cancelled': t('admin', 'statusCancelled')
  };

  const handleCloseDetailsDialog = () => {
    setShowDetailsDialog(false);
    setSelectedOrder(null);
    setSelectedBoletoFile(null);
    setBoletoUploadProgress(0);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-card-foreground">{t('admin', 'orders')}</h1>
      </div>

      {/* Status Tabs */}
      <Tabs defaultValue="all" className="mb-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setStatusFilter(null)}>Todos</TabsTrigger>
          <TabsTrigger value="pending" onClick={() => setStatusFilter("pending")}>Pendentes</TabsTrigger>
          <TabsTrigger value="aguardando_pagamento" onClick={() => setStatusFilter("aguardando_pagamento")}>Aguardando Pagamento</TabsTrigger>
          <TabsTrigger value="confirmed" onClick={() => setStatusFilter("confirmed")}>Confirmados</TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setStatusFilter("completed")}>Concluídos</TabsTrigger>
          <TabsTrigger value="cancelled" onClick={() => setStatusFilter("cancelled")}>Cancelados</TabsTrigger>
          <TabsTrigger value="pending_delivery" onClick={() => setStatusFilter("pending_delivery")}>Aguardando Entrega</TabsTrigger>
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
                  <DropdownMenuItem onClick={() => setStatusFilter("aguardando_pagamento")}>
                    Aguardando Pagamento
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
          ) : statusFilter === "pending_delivery" ? (
            pendingDeliveryOrders && pendingDeliveryOrders.length > 0 ? (
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
                  {pendingDeliveryOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted transition-colors">
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
                                handleDeleteOrder(String(order.id));
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
                <p className="text-gray-500">Nenhum pedido aguardando entrega.</p>
              </div>
            )
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
                  <TableRow key={order.id} className="hover:bg-muted transition-colors">
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
                              handleDeleteOrder(String(order.id));
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
        <Dialog open={showDetailsDialog} onOpenChange={handleCloseDetailsDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido #{selectedOrder.id}</DialogTitle>
              <DialogDescription>
                Visualize e gerencie os detalhes deste pedido, incluindo status, observações e anexos.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Cliente</h3>
                  <div className="mt-1 flex items-center">
                    <UserIcon className="h-5 w-5 text-muted-foreground mr-2" />
                    <p className="text-card-foreground">{getUserName(selectedOrder.userId)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Evento</h3>
                  <p className="mt-1 text-card-foreground">{getEventTitle(selectedOrder.eventId)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Data do Evento</h3>
                  <div className="mt-1 flex items-center">
                    <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
                    <p className="text-card-foreground">{formatDate(selectedOrder.date)}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Menu Selecionado</h3>
                  <p className="mt-1 text-card-foreground">{selectedOrder.menuSelection || "N/A"}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Número de Convidados</h3>
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
                        <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
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
                      <div key={idx} className="p-2 bg-muted rounded">
                        <div className="text-card-foreground whitespace-pre-line">
                          <input
                            type="text"
                            className="w-full p-2 border border-border rounded-md mb-2 bg-muted text-card-foreground"
                            value={note.text}
                            readOnly
                          />
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {note.author} — {note.date ? new Date(note.date).toLocaleString('pt-BR') : ""}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <textarea
                className="mt-1 w-full min-h-[60px] border border-border rounded-md p-2 bg-muted text-card-foreground"
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
            
            {/* Upload de Boleto */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">Anexar Boleto (PDF)</h3>
              
              {/* Botão de upload elegante */}
              <div className="mt-2">
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedBoletoFile(file);
                      toast({
                        title: "Boleto selecionado",
                        description: `${file.name} foi anexado com sucesso.`,
                      });
                      
                      // Teste automático do upload básico
                      setTimeout(async () => {
                        try {
                          console.log("=== TESTE AUTOMÁTICO DE UPLOAD ===");
                          const testFormData = new FormData();
                          testFormData.append("boleto", file);
                          
                          const testResponse = await fetch(`http://localhost:5000/api/test-upload`, {
                            method: 'POST',
                            body: testFormData,
                            credentials: 'include'
                          });
                          
                          console.log("Teste automático - Status:", testResponse.status);
                          const testResult = await testResponse.json();
                          console.log("Teste automático - Resultado:", testResult);
                          
                          if (testResponse.ok) {
                            console.log("✅ Teste de upload básico funcionou!");
                          } else {
                            console.log("❌ Teste de upload básico falhou:", testResult.message);
                          }
                        } catch (error) {
                          console.error("❌ Erro no teste automático:", error);
                        }
                      }, 1000);
                    }
                  }}
                  className="hidden"
                  id="boleto-upload"
                />
                <label
                  htmlFor="boleto-upload"
                  className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-card-foreground bg-muted hover:bg-card focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
                  Escolher Arquivo PDF
                </label>
              </div>
              
              {selectedBoletoFile && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-green-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">
                        {selectedBoletoFile.name}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {(selectedBoletoFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBoletoFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    Clique em "Atualizar Status" para enviar o boleto e alterar o status para "Aguardando Pagamento"
                  </p>
                  
                  {/* Botão de teste */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                      try {
                        console.log("=== TESTE DE UPLOAD ===");
                        const formData = new FormData();
                        formData.append("boleto", selectedBoletoFile);
                        
                        const response = await fetch(`http://localhost:5000/api/test-upload`, {
                          method: 'POST',
                          body: formData,
                          credentials: 'include'
                        });
                        
                        console.log("Teste - Status:", response.status);
                        const result = await response.json();
                        console.log("Teste - Resultado:", result);
                        
                        if (response.ok) {
                          toast({
                            title: "Sucesso",
                            description: "Teste de upload funcionou!"
                          });
                        } else {
                          toast({
                            title: "Erro",
                            description: `Teste falhou: ${result.message}`,
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        console.error("Erro no teste:", error);
                        toast({
                          title: "Erro",
                          description: "Erro no teste de upload",
                          variant: "destructive"
                        });
                      }
                    }}
                  >
                    Testar Upload
                  </Button>
                  
                  {/* Botão de teste simples */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-2"
                    onClick={async () => {
                      try {
                        console.log("=== TESTE SIMPLES ===");
                        const formData = new FormData();
                        formData.append("boleto", selectedBoletoFile);
                        
                        const response = await fetch(`http://localhost:5000/api/simple-test`, {
                          method: 'POST',
                          body: formData,
                          credentials: 'include'
                        });
                        
                        console.log("Teste simples - Status:", response.status);
                        const result = await response.json();
                        console.log("Teste simples - Resultado:", result);
                        
                        toast.info(`Teste simples: ${result.message}`);
                      } catch (error) {
                        console.error("Erro no teste simples:", error);
                        toast.error("Erro no teste simples");
                      }
                    }}
                  >
                    Teste Simples
                  </Button>
                </div>
              )}
              
              {selectedOrder.boletoUrl && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-600 mr-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-800">
                        Boleto já anexado
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Clique no link abaixo para visualizar
                      </p>
                    </div>
                  </div>
                  <a
                    href={selectedOrder.boletoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Visualizar boleto atual
                  </a>
                </div>
              )}
              
              {boletoUploadProgress > 0 && boletoUploadProgress < 100 && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Enviando boleto...</span>
                    <span>{boletoUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${boletoUploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button variant="outline">Fechar</Button>
              </DialogClose>
              <Button 
                onClick={handleStatusUpdate}
                disabled={(!selectedBoletoFile && selectedOrder.status === orderStatusValue) || updateOrderStatusMutation.isPending}
              >
                {updateOrderStatusMutation.isPending ? "Atualizando..." : 
                 selectedBoletoFile ? "Enviar Boleto e Atualizar Status" : "Atualizar Status"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
