import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";
import CartItem from "./cart-item";
import { CartItem as CartItemType, Order } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package2 } from "lucide-react";
import { useLocation } from "wouter";
import { PaymentConfirmationModal } from "@/components/orders/payment-confirmation-modal";
import { useLanguage } from "@/context/language-context";
import { OrderReviewModal } from "../orders/order-review-modal";

interface CartItem extends CartItemType {
  menuItems?: {
    entradas?: string[];
    pratosPrincipais?: string[];
    sobremesas?: string[];
  };
  time?: string;
}

export default function CartModal() {
  const { cartItems, cartOpen, closeCart, clearCart, calculateSubtotal } = useCart();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [processing, setProcessing] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [createdOrderIds, setCreatedOrderIds] = useState<number[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [showOrderSuccessModal, setShowOrderSuccessModal] = useState(false);
  const { t } = useLanguage();

  const subtotal = calculateSubtotal();
  const serviceCharge = subtotal * 0.1; // 10% service fee
  console.log("cartItems", cartItems);
  const waiterFeeTotal = cartItems.reduce((sum, item) => {
    const itemWaiterFee = typeof item.waiterFee === 'number' && !isNaN(item.waiterFee) ? item.waiterFee : 0;
    console.log(`Item ${item.title} - waiterFee: ${itemWaiterFee}, quantity: ${item.quantity}`);
    return sum + (itemWaiterFee * item.quantity);
  }, 0);
  console.log("waiterFeeTotal", waiterFeeTotal);
  const total = subtotal + serviceCharge + waiterFeeTotal;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      try {
        console.log("Sending order data:", orderData);
      const res = await apiRequest("POST", "/api/orders", orderData);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Erro ao criar pedido");
        }
      return await res.json();
      } catch (error) {
        console.error("Error creating order:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast.error("Ocorreu um erro ao processar seu pedido. Por favor, tente novamente mais tarde.");
    },
  });

  const handleCheckout = async () => {
    console.log("🛒 Clique no botão Finalizar Pedido detectado!");
    
    if (!user) {
      console.log("❌ Usuário não autenticado, redirecionando para login");
      closeCart();
      navigate("/auth");
      toast.error("Você precisa estar logado para finalizar o pedido.");
      return;
    }

    if (cartItems.length === 0) {
      console.log("❌ Carrinho vazio");
      toast.error("Carrinho vazio. Adicione itens ao carrinho antes de finalizar o pedido.");
      return;
    }

    console.log("✅ Iniciando processo de checkout");
    console.log("Total de itens no carrinho:", cartItems.length);

    setProcessing(true);
    const orderIds: number[] = [];

    try {
      // Process orders sequentially to avoid race conditions
      for (const item of cartItems as CartItem[]) {
        console.log("📦 Processando item:", item.title);
        
        // Extrair data e hora do item do carrinho
        const dateStr = item.date;
        const timeStr = item.time || "12:00"; // Default para meio-dia se não houver tempo
        
        console.log("📅 Data original:", dateStr);
        console.log("🕒 Hora original:", timeStr);
        
        // Construir string de data completa no formato ISO
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        console.log("📊 Componentes de data/hora:", { year, month, day, hours, minutes });
        
        // Criar objeto Date JavaScript - certifique-se de que está no fuso horário correto
        const eventDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        console.log("📆 Objeto Date criado:", eventDate);
        console.log("📆 Date.toString():", eventDate.toString());
        console.log("📆 Date.toISOString():", eventDate.toISOString());
        
        if (isNaN(eventDate.getTime())) {
          console.error("❌ Data inválida criada");
          throw new Error("Data do evento inválida");
        }

        // Calcular total com 2 casas decimais
        const totalAmount = Number((item.price * item.quantity).toFixed(2));

        // Dados adicionais para o pedido
        const additionalInfo = {
          quantity: Number(item.quantity),
          imageUrl: item.imageUrl || '',
          selectedItems: item.menuItems
        };

        // Preparar dados do pedido com tipagem estrita
      const orderData = {
          userId: Number(user.id),
          eventId: Number(item.eventId),
        status: "pending",
          date: eventDate.toISOString(),
          guestCount: Number(item.guestCount),
          menuSelection: item.menuSelection || null,
          location: item.location || null,
          totalAmount: totalAmount + (item.waiterFee || 0),
          waiterFee: item.waiterFee || 0,
          additionalInfo: JSON.stringify(additionalInfo)
        };

        // Log dos dados sendo enviados
        console.log("📤 Enviando dados do pedido:", JSON.stringify(orderData, null, 2));
        console.log("🗺️ Valor de item.location:", item.location);
        
        try {
          console.log("🔄 Iniciando requisição POST para /api/orders");
          const response = await apiRequest("POST", "/api/orders", orderData);
          console.log("🔄 Resposta recebida:", response.status, response.statusText);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Resposta de erro:", errorText);
            
            try {
              const errorData = JSON.parse(errorText);
              console.error("❌ Detalhes do erro API:", errorData);
              throw new Error(
                errorData.details 
                  ? `Erro de validação: ${JSON.stringify(errorData.details)}`
                  : errorData.message || "Erro ao criar pedido"
              );
            } catch (parseError) {
              console.error("❌ Erro ao analisar resposta de erro:", parseError);
              throw new Error(`Erro ao criar pedido: ${errorText}`);
            }
          }
          
          const responseData = await response.json();
          console.log("✅ Pedido criado com sucesso:", responseData);
          orderIds.push(responseData.id);
        } catch (error) {
          console.error("❌ Detalhes do erro ao criar pedido:", error);
          throw error;
        }
      }

      // If all orders were created successfully
      console.log("🎉 Todos os pedidos foram criados com sucesso");
      setProcessing(false);
      clearCart();
      closeCart();
      setCreatedOrderIds(orderIds);
      setShowOrderSuccessModal(true);
      
    } catch (error) {
      console.error("❌ Erro durante checkout:", error);
      setProcessing(false);
      if (error instanceof Error) {
        toast.error(error.message);
      }
    }
  };
  
  const handlePayNow = () => {
    // Fechar o modal de carrinho e o prompt de pagamento
    closeCart();
    setShowPaymentPrompt(false);
    
    // Redirecionar para a página de pedidos com o primeiro pedido já selecionado para pagamento
    // Também incluir o parâmetro newOrder=true para garantir atualização imediata dos dados
    if (createdOrderIds.length > 0) {
      // Navegando para a página de pedidos com parâmetros para abrir pagamento e indicar pedido novo
      navigate(`/orders?pay=${createdOrderIds[0]}&newOrder=true`);
    } else {
      navigate("/orders?newOrder=true");
    }
    
    toast.success("Pedido registrado com sucesso! Prossiga com o pagamento para confirmar sua reserva.");
  };
  
  const handlePayLater = () => {
    // Fechar o modal de carrinho e o prompt de pagamento
    closeCart();
    setShowPaymentPrompt(false);
    
    // Redirecionar para a página de pedidos com parâmetro para indicar novo pedido
    navigate("/orders?newOrder=true");
    
    toast.success("Pedido registrado! Lembre-se de que ele será confirmado apenas após o pagamento.");
  };

  const handleReviewSuccess = () => {
    clearCart();
    closeCart();
    navigate("/orders");
  };

  return (
    <>
    <Dialog open={cartOpen} onOpenChange={closeCart}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader className="flex justify-between items-center flex-row">
          <DialogTitle className="flex items-center">
            <ShoppingCart className="mr-2" size={18} />
            {t('cart', 'title')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-grow p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Package2 className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-medium text-muted-foreground mb-2">{t('cart', 'empty')}</h3>
              <p className="text-muted-foreground text-center mb-6">
                {t('cart', 'emptyDescription')}
              </p>
              <Button onClick={closeCart}>{t('cart', 'continueShopping')}</Button>
            </div>
          ) : (
            <>
              {cartItems.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
            </>
          )}
        </div>
        
        {cartItems.length > 0 && (
            <DialogFooter className="border-t border-border p-4">
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart', 'subtotal')}</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart', 'serviceFee')}</span>
              <span className="font-medium">{formatCurrency(serviceCharge)}</span>
            </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('cart', 'waiterFee')}</span>
                    <span className="font-medium">{formatCurrency(waiterFeeTotal)}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span>{t('cart', 'total')}</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
                </div>
                <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={closeCart}
              >
                {t('cart', 'continueShopping')}
              </Button>
              <Button 
                className="flex-1"
                onClick={handleCheckout}
                disabled={processing}
              >
                    {processing ? (
                      <div className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        {t('cart', 'processing')}
                      </div>
                    ) : (
                      t('cart', 'checkout')
                    )}
              </Button>
            </div>
          </div>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
      
      {/* Modal de confirmação de pagamento */}
      {/*
      <PaymentConfirmationModal
        open={showPaymentPrompt}
        onOpenChange={setShowPaymentPrompt}
        onPayNow={handlePayNow}
        onPayLater={handlePayLater}
      />
      */}

      {/* Modal de Revisão do Pedido */}
      <OrderReviewModal
        order={createdOrder}
        open={showReviewModal}
        onOpenChange={setShowReviewModal}
        onSuccess={handleReviewSuccess}
      />

      {/* Modal de sucesso do novo fluxo */}
      <Dialog open={showOrderSuccessModal} onOpenChange={setShowOrderSuccessModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Pedido realizado com sucesso!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Seu pedido foi registrado! Você receberá um email com o boleto em breve.<br/>
              Você também poderá baixar o boleto em <b>Meus Pedidos</b> assim que ele estiver disponível.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              setShowOrderSuccessModal(false);
              navigate('/orders?newOrder=true');
            }}>
              Ir para Meus Pedidos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
