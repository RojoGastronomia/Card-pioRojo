import { Order, Event } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Users } from "lucide-react";
import { useEffect } from "react";

interface OrderDetailsModalProps {
  order: Order | null;
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({
  order,
  event,
  open,
  onOpenChange,
}: OrderDetailsModalProps) {
  useEffect(() => {
    if (open && order) {
      console.log(`[DEBUG-MODAL] Modal aberto para pedido ID: ${order.id}`);
      console.log(`[DEBUG-MODAL] Dados do pedido:`, order);
      console.log(`[DEBUG-MODAL] Dados do evento:`, event);
    }
  }, [open, order, event]);

  if (!order) {
    console.warn("[DEBUG-MODAL] Tentativa de abrir modal sem dados de pedido");
    return null;
  }

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

  const getStatusText = (status: string): string => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendente";
      case "cancelled":
        return "Cancelado";
      case "completed":
        return "Concluído";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Detalhes do Pedido #{order.id}</DialogTitle>
        </DialogHeader>
        <div className="py-4 overflow-y-auto pr-2">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Data do pedido</span>
              <span className="text-sm">{formatDate(order.createdAt)}</span>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Detalhes do Evento</h4>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                  <span className="break-words">{event?.title || `Evento #${order.eventId}`}</span>
                </div>
                {event?.location && (
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                    <span className="break-words">{event.location}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2 text-gray-500 shrink-0" />
                  <span>{order.guestCount} convidados</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Menu Selecionado</h4>
              <p className="text-sm font-medium">{order.menuSelection || "Não especificado"}</p>
              {order.additionalInfo && (
                <div className="mt-3">
                  <h5 className="text-sm font-medium mb-2 text-primary">Itens Selecionados</h5>
                  {typeof order.additionalInfo === 'string' && order.additionalInfo.startsWith('{') ? (
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                      {(() => {
                        try {
                          // Tentar analisar o JSON
                          const additionalData = JSON.parse(order.additionalInfo);
                          
                          // Se for um objeto com itens de menu selecionados
                          if (additionalData.selectedItems) {
                            return (
                              <div className="space-y-3">
                                {Object.entries(additionalData.selectedItems).map(([category, items]: [string, any], index) => (
                                  <div key={index} className="pb-2">
                                    <strong className="text-gray-900 uppercase text-xs tracking-wider border-b border-gray-200 pb-1 block mb-2">
                                      {category}
                                    </strong>
                                    <ul className="list-disc ml-4 space-y-1">
                                      {Array.isArray(items) ? items.map((item, idx) => (
                                        <li key={idx} className="ml-1">{item}</li>
                                      )) : (
                                        <li className="ml-1">{items}</li>
                                      )}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          
                          // Para outros tipos de objetos, exibir como lista de propriedades
                          return (
                            <div className="bg-gray-50 p-3 rounded-md">
                              <ul className="space-y-2">
                                {Object.entries(additionalData).map(([key, value], index) => (
                                  <li key={index} className="flex flex-wrap">
                                    <strong className="mr-2 text-gray-700">{key}:</strong> 
                                    <span className="text-gray-600 break-all">{
                                      typeof value === 'object' 
                                        ? JSON.stringify(value) 
                                        : String(value)
                                    }</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          );
                        } catch (e) {
                          // Se não for um JSON válido, exibir como texto
                          console.error('Erro ao parsear JSON:', e);
                          return <p className="italic text-gray-500">{order.additionalInfo}</p>;
                        }
                      })()}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">{String(order.additionalInfo)}</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="font-medium text-primary">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 