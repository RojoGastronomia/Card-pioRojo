import { useState } from "react";
import { Order, Event } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Calendar, MapPin, Users, Download, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { apiRequest } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

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
  const [isDownloading, setIsDownloading] = useState(false);

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "pending":
        return {
          label: "Pendente",
          icon: Clock,
          color: "bg-yellow-100 text-yellow-800",
          description: "Aguardando processamento"
        };
      case "confirmed":
        return {
          label: "Confirmado",
          icon: CheckCircle,
          color: "bg-green-100 text-green-800",
          description: "Pedido confirmado"
        };
      case "completed":
        return {
          label: "Concluído",
          icon: CheckCircle,
          color: "bg-blue-100 text-blue-800",
          description: "Evento realizado"
        };
      case "cancelled":
        return {
          label: "Cancelado",
          icon: XCircle,
          color: "bg-red-100 text-red-800",
          description: "Pedido cancelado"
        };
      case "aguardando_pagamento":
        return {
          label: "Aguardando Pagamento",
          icon: AlertCircle,
          color: "bg-orange-100 text-orange-800",
          description: "Aguardando confirmação do pagamento"
        };
      default:
        return {
          label: status,
          icon: AlertCircle,
          color: "bg-gray-100 text-gray-800",
          description: "Status desconhecido"
        };
    }
  };

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  const handleDownloadBoleto = async () => {
    if (!order.boletoUrl) return;
    
    setIsDownloading(true);
    try {
      const response = await apiRequest("GET", `/api/orders/${order.id}/boleto`);
      
      if (response.ok) {
        // Criar blob do arquivo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Criar link de download
        const a = document.createElement('a');
        a.href = url;
        a.download = `boleto_pedido_${order.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        
        // Limpar
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('Erro ao baixar boleto:', response.statusText);
        alert('Erro ao baixar o boleto. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao baixar boleto:', error);
      alert('Erro ao baixar o boleto. Tente novamente.');
    } finally {
      setIsDownloading(false);
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
            <div className="flex items-center space-x-2">
              <StatusIcon className="h-4 w-4" />
              <Badge className={statusInfo.color}>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            
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

            {/* Seção do Boleto */}
            {order.boletoUrl && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Boleto Bancário
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    O boleto para este pedido está disponível para download.
                  </p>
                  <Button 
                    onClick={handleDownloadBoleto}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Baixando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Baixar Boleto
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

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