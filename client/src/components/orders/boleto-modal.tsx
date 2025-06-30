import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Download, CheckCircle, AlertCircle } from "lucide-react";
import { type Order, type Event } from "@shared/schema";
import { toast } from "sonner";

interface BoletoModalProps {
  order: Order | null;
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmPayment: (order: Order) => void;
}

export function BoletoModal({ order, event, open, onOpenChange, onConfirmPayment }: BoletoModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!order || !event) return null;

  // Debug: verificar se o boletoUrl está chegando
  console.log("BoletoModal - Order:", order);
  console.log("BoletoModal - boletoUrl:", order.boletoUrl);

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    try {
      await onConfirmPayment(order);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDownloadBoleto = () => {
    console.log("Tentando baixar boleto para pedido:", order.id);
    console.log("boletoUrl do pedido:", order.boletoUrl);
    
    if (order.boletoUrl) {
      // O boletoUrl é apenas o nome do arquivo, não a URL completa
      // Vamos usar o endpoint de download que já está configurado
      const downloadUrl = `http://localhost:5000/api/orders/${order.id}/boleto`;
      console.log("URL de download construída:", downloadUrl);
      
      // Tentar fazer o download
      try {
        // Abrir em nova aba para download
        window.open(downloadUrl, '_blank');
        console.log("Download iniciado com sucesso");
      } catch (error) {
        console.error("Erro ao abrir download:", error);
        toast.error("Erro ao baixar boleto. Tente novamente.");
      }
    } else {
      console.error("Boleto URL não encontrada para o pedido:", order.id);
      toast.error("Boleto ainda não foi preparado. Entre em contato com o suporte ou aguarde o envio por email.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(amount);
  };

  const formatDate = (dateString: Date) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Boleto - Pedido #{order.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Pedido */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3">Informações do Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Evento</p>
                <p className="font-medium">{event.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data do Evento</p>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="font-medium">{formatDate(order.date)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Menu</p>
                <p className="font-medium">{order.menuSelection}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Convidados</p>
                <p className="font-medium">{order.guestCount}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">Valor Total</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {formatCurrency(order.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Boleto */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Boleto Bancário</h3>
            </div>
            
            <div className="space-y-3">
              <p className="text-sm text-blue-800">
                O boleto para este pedido está disponível para download. 
                Após o pagamento, clique em "Confirmar Pagamento" para atualizar o status do seu pedido.
              </p>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadBoleto}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Download className="h-4 w-4" />
                  Baixar Boleto
                </Button>
                <Button
                  onClick={() => {
                    console.log("=== DEBUG INFO ===");
                    console.log("Order ID:", order.id);
                    console.log("Boleto URL:", order.boletoUrl);
                    console.log("Download URL:", `http://localhost:5000/api/orders/${order.id}/boleto`);
                    console.log("Current origin:", window.location.origin);
                    console.log("==================");
                    toast.info("Informações de debug no console");
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Debug
                </Button>
              </div>
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Instruções</h4>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Baixe o boleto e pague em qualquer banco ou lotérica</li>
                  <li>• O prazo de vencimento está no boleto</li>
                  <li>• Após o pagamento, clique em "Confirmar Pagamento"</li>
                  <li>• Aguarde a confirmação do pagamento</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Status do Pedido */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                Aguardando Pagamento
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              Pedido criado em {formatDate(order.createdAt)}
            </p>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Fechar
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={isConfirming}
            className="flex-1 flex items-center gap-2"
          >
            {isConfirming ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Confirmando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 