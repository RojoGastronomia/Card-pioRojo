import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest } from "@/lib/queryClient";
import { Order } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, Mail } from "lucide-react";

interface OrderReviewModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OrderReviewModal({
  order,
  open,
  onOpenChange,
  onSuccess,
}: OrderReviewModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/submit`, {});
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao enviar pedido");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast.success("Pedido enviado com sucesso! Você receberá um email com os detalhes.");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao enviar pedido");
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    if (!order) return;
    setIsSubmitting(true);
    submitOrderMutation.mutate(order.id);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Revisar Pedido</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo do Pedido */}
          <div className="space-y-2">
            <h3 className="font-medium">Resumo do Pedido</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total do pedido:</span>
                <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className="font-medium capitalize">
                  {order.status === "pending" ? "Pendente" :
                   order.status === "confirmed" ? "Confirmado" :
                   order.status === "cancelled" ? "Cancelado" :
                   order.status === "completed" ? "Concluído" : order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Informações do Evento */}
          {/*
          <div className="space-y-2">
            <h3 className="font-medium">Informações do Evento</h3>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Data:</span>
                <span className="font-medium">{new Date(order.date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Horário:</span>
                <span className="font-medium">{new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
          */}

          {/* Mensagem de Confirmação */}
          <div className="bg-primary/5 p-4 rounded-lg space-y-2">
            <div className="flex items-start space-x-2">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Ao confirmar, você receberá um email com os detalhes do pedido e nossa equipe comercial entrará em contato para finalizar os detalhes.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          {/*
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirmar Pedido</span>
              </div>
            )}
          </Button>
          */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 