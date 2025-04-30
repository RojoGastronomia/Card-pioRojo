import { CreditCard, Clock, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaymentConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPayNow: () => void;
  onPayLater: () => void;
}

export function PaymentConfirmationModal({
  open,
  onOpenChange,
  onPayNow,
  onPayLater,
}: PaymentConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Deseja realizar o pagamento agora?</DialogTitle>
          <DialogDescription className="pt-4">
            Seu pedido foi registrado! Você pode escolher pagar agora ou mais tarde, mas lembre-se que ele só será confirmado após o pagamento.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 gap-4 py-4">
          <button 
            className="flex items-start space-x-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
            onClick={onPayNow}
          >
            <div className="bg-primary/10 p-2 rounded-full">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Pagar agora</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Realize o pagamento imediatamente e garanta sua reserva.
              </p>
            </div>
          </button>
          
          <button 
            className="flex items-start space-x-4 p-4 border rounded-lg hover:border-primary transition-colors text-left"
            onClick={onPayLater}
          >
            <div className="bg-primary/10 p-2 rounded-full">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">Pagar depois</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Você poderá pagar mais tarde acessando a página "Meus Pedidos".
              </p>
            </div>
          </button>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start space-x-2 mb-4">
          <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Atenção: Seu pedido permanecerá como "Pendente" até que o pagamento seja confirmado. Pedidos não pagos podem ser cancelados automaticamente após 48 horas.
          </p>
        </div>
        
        <DialogFooter className="flex gap-3 sm:gap-0">
          <Button variant="outline" onClick={onPayLater}>
            Pagar depois
          </Button>
          <Button onClick={onPayNow}>
            Pagar agora
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 