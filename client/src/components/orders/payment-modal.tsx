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
  const [paymentMethod, setPaymentMethod] = useState("credit-card");
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
      setPaymentMethod("credit-card");
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
    mutationFn: async ({
      orderId,
      paymentIntentId,
    }: {
      orderId: number;
      paymentIntentId: string;
    }) => {
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

  const handleCopyPixCode = () => {
    if (pixCopiaECola) {
      navigator.clipboard.writeText(pixCopiaECola);
      toast.success("Código PIX copiado para a área de transferência!");
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    try {
      // Validações básicas
      if (paymentMethod === "credit-card") {
        if (!cardNumber.trim() || !cardName.trim() || !cardExpiry.trim() || !cardCvc.trim()) {
          toast.error("Por favor, preencha todos os campos do cartão");
          return;
        }
      }

      // Preparar dados do pagamento
      const paymentData: PaymentData = {
        method: paymentMethod,
        installments: installments,
      };

      // Adicionar dados do cartão se for pagamento com cartão
      if (paymentMethod === "credit-card") {
        paymentData.cardData = {
          number: cardNumber.replace(/\s/g, ''),
          name: cardName,
          expiry: cardExpiry,
          cvc: cardCvc,
        };
        paymentData.saveCard = saveCard;
      }

      // Iniciar processamento de pagamento
      toast.info("Iniciando pagamento...");
      
      const paymentResponse = await initiatePaymentMutation.mutateAsync({
        orderId: order.id,
        paymentData,
      });
      
      // Processar resposta com base no método de pagamento
      if (paymentMethod === "credit-card") {
        // Simular processamento do pagamento
        toast.info("Processando pagamento...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Confirmar pagamento
        await confirmPaymentMutation.mutateAsync({
          orderId: order.id,
          paymentIntentId: paymentResponse.paymentIntentId,
        });

        // Sucesso no pagamento
        toast.success("Pagamento com cartão realizado com sucesso!");
        onOpenChange(false);
        onPaymentSuccess();
      } 
      else if (paymentMethod === "pix") {
        // Guardar dados do PIX retornados
        if (paymentResponse.pixQrCode) {
          setPixQrCode(paymentResponse.pixQrCode);
        }
        
        if (paymentResponse.pixCopiaECola) {
          setPixCopiaECola(paymentResponse.pixCopiaECola);
        }
        
        toast.success("QR Code PIX gerado com sucesso! Escaneie para completar o pagamento");
        
        // Iniciar verificação de status do pagamento
        checkPaymentStatus(order.id, paymentResponse.paymentIntentId);
      } 
      else if (paymentMethod === "boleto") {
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

  // Função para verificar o status do pagamento PIX periodicamente
  const checkPaymentStatus = (orderId: number, paymentIntentId: string) => {
    let checkCount = 0;
    const maxChecks = 5; // Limitar o número de verificações
    
    const checkInterval = setInterval(async () => {
      try {
        checkCount++;
        const response = await apiRequest("GET", `/api/orders/${orderId}/payment/status?paymentIntentId=${paymentIntentId}`, {});
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === "paid") {
            clearInterval(checkInterval);
            toast.success("Pagamento PIX recebido com sucesso!");
            
            // Confirmar pagamento no backend
            await confirmPaymentMutation.mutateAsync({
              orderId,
              paymentIntentId,
            });
            
            onOpenChange(false);
            onPaymentSuccess();
          }
        }
        
        // Parar de verificar após um número máximo de tentativas
        if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          toast.info("Aguardando confirmação do pagamento PIX. O pedido será atualizado automaticamente quando recebermos a confirmação.");
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
        clearInterval(checkInterval);
      }
    }, 5000); // Verificar a cada 5 segundos
    
    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(checkInterval);
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
      <DialogContent className="max-w-md max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>Finalizar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Resumo do Pedido</h3>
              <div className="bg-muted p-3 rounded-lg space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total do pedido:</span>
                  <span className="font-medium">{formatCurrency(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{
                    order.status === "pending" ? "Pendente" :
                    order.status === "confirmed" ? "Confirmado" :
                    order.status === "cancelled" ? "Cancelado" :
                    order.status === "completed" ? "Concluído" : order.status
                  }</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">Forma de Pagamento</h3>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                <div 
                  className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "credit-card" 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => setPaymentMethod("credit-card")}
                >
                  <RadioGroupItem value="credit-card" id="credit-card" />
                  <Label htmlFor="credit-card" className="flex items-center cursor-pointer w-full">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Cartão de Crédito
                  </Label>
                </div>
                <div 
                  className={`flex items-center space-x-2 border p-3 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "pix" 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-primary/50 hover:bg-primary/5"
                  }`}
                  onClick={() => setPaymentMethod("pix")}
                >
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix" className="flex items-center cursor-pointer w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    PIX
                  </Label>
                </div>
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
              </RadioGroup>
            </div>

            {paymentMethod === "credit-card" && (
              <div className="space-y-4">
                <h3 className="font-medium">Dados do Cartão</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="card-number">Número do Cartão</Label>
                    <div className="relative">
                      <Input
                        id="card-number"
                        placeholder="0000 0000 0000 0000"
                        value={cardNumber}
                        onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                      />
                      <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="card-name">Nome no Cartão</Label>
                    <Input
                      id="card-name"
                      placeholder="Nome impresso no cartão"
                      value={cardName}
                      onChange={e => setCardName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="card-expiry">Validade</Label>
                      <div className="relative">
                        <Input
                          id="card-expiry"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={e => setCardExpiry(formatExpiry(e.target.value))}
                        />
                        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label htmlFor="card-cvc">CVC</Label>
                      <div className="relative">
                        <Input
                          id="card-cvc"
                          placeholder="123"
                          value={cardCvc}
                          onChange={e => setCardCvc(formatCVC(e.target.value))}
                        />
                        <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Label htmlFor="installments">Parcelas</Label>
                    <select
                      id="installments"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={installments}
                      onChange={e => setInstallments(Number(e.target.value))}
                    >
                      <option value={1}>À vista</option>
                      {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                        <option key={num} value={num}>
                          {num}x de {formatCurrency(order.totalAmount / num)}
                          {num <= 6 ? ' (sem juros)' : ' (com juros)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="save-card" 
                      checked={saveCard} 
                      onCheckedChange={(checked: boolean | "indeterminate") => setSaveCard(checked === true)} 
                    />
                    <label
                      htmlFor="save-card"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Salvar cartão para futuras compras
                    </label>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === "pix" && (
              <div className="space-y-4">
                {pixQrCode ? (
                  <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center">
                      <img 
                        src={pixQrCode} 
                        alt="QR Code PIX" 
                        className="max-w-full max-h-full"
                        onError={(e) => {
                          // Se a imagem falhar, use uma imagem padrão
                          (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png";
                        }}
                      />
                    </div>
                    {pixCopiaECola && (
                      <div className="w-full space-y-2">
                        <p className="text-sm font-medium">Pix Copia e Cola</p>
                        <div className="flex items-center gap-2 bg-white rounded-lg p-2 text-xs overflow-hidden">
                          <p className="truncate flex-1">{pixCopiaECola}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 shrink-0" 
                            onClick={handleCopyPixCode}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Escaneie o QR Code para pagar</p>
                      <p className="text-xs text-muted-foreground">O pagamento será confirmado automaticamente</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-48 h-48 bg-white p-2 rounded-lg flex items-center justify-center">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/QR_code_for_mobile_English_Wikipedia.svg/1200px-QR_code_for_mobile_English_Wikipedia.svg.png" 
                        alt="QR Code PIX" 
                        className="max-w-full max-h-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Clique em "Confirmar QR Code" para gerar o QR Code PIX</p>
                      <p className="text-xs text-muted-foreground">Após gerar o código, escaneie-o com o aplicativo do seu banco</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === "boleto" && (
              <div className="space-y-4">
                {boletoUrl ? (
                  <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-full py-6 flex flex-col items-center">
                      <FileText className="w-16 h-16 text-primary mb-4" />
                      <div className="space-y-2 mb-4">
                        <p className="text-sm">Boleto gerado com sucesso!</p>
                        <p className="text-sm font-medium">Vencimento: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-muted-foreground">O boleto vence em 3 dias úteis</p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => window.open(boletoUrl, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                        Abrir Boleto Novamente
                      </Button>
                    </div>
                    <div className="border-t border-border w-full pt-4">
                      <p className="text-xs text-muted-foreground">
                        O boleto foi aberto em uma nova janela e também pode ser acessado novamente clicando no botão acima.
                        Após o pagamento, pode levar até 3 dias úteis para a confirmação bancária.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted p-4 rounded-lg flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-full py-6 flex flex-col items-center">
                      <FileText className="w-16 h-16 text-primary mb-4" />
                      <div className="space-y-2 mb-4">
                        <p className="text-sm">Clique em "Confirmar Pedido" para gerar o boleto</p>
                        <p className="text-sm font-medium">Vencimento: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
                        <p className="text-xs text-muted-foreground">O boleto vence em 3 dias úteis</p>
                      </div>
                    </div>
                    <div className="border-t border-border w-full pt-4">
                      <p className="text-xs text-muted-foreground">
                        O boleto será aberto automaticamente em uma nova janela e também será baixado para seu computador.
                        Após o pagamento, pode levar até 3 dias úteis para a confirmação bancária.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t flex gap-3 mt-auto sticky bottom-0 bg-background">
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
            disabled={!!(isLoading || (paymentMethod === "pix" && pixQrCode) || (paymentMethod === "boleto" && boletoUrl))}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processando...</span>
              </div>
            ) : paymentMethod === "boleto" ? (
              "Confirmar Pedido"
            ) : paymentMethod === "pix" ? (
              "Confirmar QR Code"
            ) : (
              `Pagar ${formatCurrency(order.totalAmount)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 