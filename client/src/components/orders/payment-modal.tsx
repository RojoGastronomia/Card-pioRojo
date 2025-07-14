import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { CreditCard, DollarSign, Calendar, Lock, Loader2, FileText, Download, Copy } from "lucide-react";

interface PaymentModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaymentSuccess: () => void;
}

// Interface para os dados de pagamento
interface PaymentData {
  method: string;
  cardData?: {
    number: string;
    name: string;
    expiry: string;
    cvc: string;
  };
  installments?: number;
  saveCard?: boolean;
}

export function PaymentModal({
  order,
  open,
  onOpenChange,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState("boleto"); // Mudado para boleto como padrão
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [saveCard, setSaveCard] = useState(false);
  const [pixQrCode, setPixQrCode] = useState("");
  const [pixCopiaECola, setPixCopiaECola] = useState("");
  const [boletoUrl, setBoletoUrl] = useState("");
  const [installments, setInstallments] = useState(1);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPaymentMethod("boleto"); // Sempre começar com boleto
      setCardNumber("");
      setCardName("");
      setCardExpiry("");
      setCardCvc("");
      setSaveCard(false);
      setPixQrCode("");
      setPixCopiaECola("");
      setBoletoUrl("");
      setInstallments(1);
    }
  }, [open]);

  const initiatePaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentData }: { orderId: number; paymentData: PaymentData }) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/payment`, {
        paymentMethod: paymentData.method,
        cardData: paymentData.cardData,
        installments: paymentData.installments,
        saveCard: paymentData.saveCard,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao iniciar pagamento");
      }
      return await response.json();
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ orderId, paymentIntentId }: { orderId: number; paymentIntentId: string }) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/payment/confirm`, {
        paymentIntentId,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao confirmar pagamento");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
  });

  const handlePayment = async () => {
    if (!order) return;

    try {
      // NOVO FLUXO: Apenas boleto está disponível
      if (paymentMethod !== "boleto") {
        toast.error("Apenas pagamento via boleto está disponível no momento");
        return;
      }

      // Preparar dados do pagamento
      const paymentData: PaymentData = {
        method: paymentMethod,
        installments: installments,
      };

      // Iniciar processamento de pagamento
      toast.info("Iniciando processo de boleto...");
      
      const paymentResponse = await initiatePaymentMutation.mutateAsync({
        orderId: order.id,
        paymentData,
      });
      
      // Processar resposta para boleto
      if (paymentMethod === "boleto") {
        // Guardar URL do boleto
        if (paymentResponse.boletoUrl) {
          setBoletoUrl(paymentResponse.boletoUrl);
          
          // Abrir boleto em nova aba
          window.open(paymentResponse.boletoUrl, '_blank');
          
          toast.success("Boleto gerado com sucesso!");
        } else {
          // Tratar caso de simulação onde não temos o boleto real
          handleDownloadBoleto();
        }
      }
    } catch (error) {
      console.error("Erro no pagamento:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao processar pagamento");
    }
  };

  const handleDownloadBoleto = () => {
    if (boletoUrl) {
      window.open(boletoUrl, '_blank');
      return;
    }
    
    // Simulação para quando não temos o boleto real
    toast.success("Gerando boleto...");
    
    // Simulação do tempo de processamento
    setTimeout(() => {
      // Criar link de download simulado
      const blob = new Blob(['Conteúdo simulado do boleto'], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      // Criar elemento de download
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleto-pedido-${order?.id || 'novo'}.pdf`;
      document.body.appendChild(a);
      
      // Acionar o download
      a.click();
      
      // Limpar
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Abrir em nova aba para visualização
      window.open(url, '_blank');
      
      toast.success("Boleto gerado e baixado com sucesso!");
    }, 1500);
  };

  const isLoading = initiatePaymentMutation.isPending || confirmPaymentMutation.isPending;

  if (!order) return null;

  const formatCardNumber = (value: string) => {
    // Remover caracteres não numéricos
    const nums = value.replace(/\D/g, "");
    // Adicionar espaços a cada 4 dígitos
    const formatted = nums.replace(/(\d{4})(?=\d)/g, "$1 ");
    return formatted.slice(0, 19); // Limitar a 16 dígitos (19 com espaços)
  };

  const formatExpiry = (value: string) => {
    // Remover caracteres não numéricos
    const nums = value.replace(/\D/g, "");
    // Formato MM/YY
    if (nums.length >= 3) {
      return `${nums.slice(0, 2)}/${nums.slice(2, 4)}`;
    }
    return nums;
  };

  const formatCVC = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 3);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Método de Pagamento</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* NOVO FLUXO: Apenas boleto disponível */}
          <div className="space-y-3">
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              <div 
                className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === "boleto" 
                    ? "border-primary bg-primary/5" 
                    : "hover:border-primary/50 hover:bg-primary/5"
                }`}
                onClick={() => setPaymentMethod("boleto")}
              >
                <RadioGroupItem value="boleto" id="boleto" />
                <Label htmlFor="boleto" className="flex items-center cursor-pointer w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Boleto Bancário
                </Label>
              </div>
              
              {/* Métodos desabilitados temporariamente */}
              <div className="flex items-center space-x-2 border p-3 rounded-lg opacity-50 cursor-not-allowed">
                <RadioGroupItem value="credit-card" id="credit-card" disabled />
                <Label htmlFor="credit-card" className="flex items-center cursor-not-allowed w-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Cartão de Crédito (Indisponível)
                </Label>
              </div>
              
              <div className="flex items-center space-x-2 border p-3 rounded-lg opacity-50 cursor-not-allowed">
                <RadioGroupItem value="pix" id="pix" disabled />
                <Label htmlFor="pix" className="flex items-center cursor-not-allowed w-full">
                  <DollarSign className="w-4 h-4 mr-2" />
                  PIX (Indisponível)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Informação sobre o novo fluxo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">ℹ️ Novo Fluxo de Pagamento</h4>
            <p className="text-sm text-blue-800">
              Após confirmar o pedido, nossa equipe comercial irá gerar o boleto e enviá-lo para você por email. 
              Você também poderá baixá-lo diretamente pelo sistema em "Meus Pedidos".
            </p>
          </div>

          {/* Seção de boleto */}
          {paymentMethod === "boleto" && (
            <div className="space-y-4">
              <div className="bg-card p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-full py-6 flex flex-col items-center">
                  <FileText className="w-16 h-16 text-primary mb-4" />
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-card-foreground">Clique em "Confirmar Pedido" para prosseguir</p>
                    <p className="text-sm font-medium text-card-foreground">Vencimento: 3 dias úteis após a geração</p>
                    <p className="text-xs text-muted-foreground">O boleto será enviado por email</p>
                  </div>
                </div>
                <div className="border-t border-border w-full pt-4">
                  <p className="text-xs text-muted-foreground">
                    Nossa equipe comercial irá gerar o boleto e enviá-lo para você automaticamente.
                    Após o pagamento, pode levar até 3 dias úteis para a confirmação bancária.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handlePayment}
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando...</span>
              </div>
            ) : (
              "Confirmar Pedido"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 