import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { CartItem } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogIn } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { useLanguage } from "@/context/language-context";

interface CartContextType {
  cartItems: CartItem[];
  cartOpen: boolean;
  showLoginModal: boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateCartItemQuantity: (id: number, quantity: number) => void;
  updateCartItem: (updatedItem: CartItem) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  closeLoginModal: () => void;
  calculateSubtotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Função utilitária para calcular o adicional de garçons
function calculateWaiterFee(guestCount: number) {
  const WAITER_UNIT_PRICE = 260;
  if (!guestCount) return 0;
  const numWaiters = Math.ceil(guestCount / 10);
  return numWaiters * WAITER_UNIT_PRICE;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<CartItem | null>(null);
  const { t } = useLanguage();

  // Load cart from localStorage on initial load
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        // Validar cada item do carrinho e garantir waiterFee
        const validCart = parsedCart.filter((item: any) => 
          item && 
          item.eventId && 
          item.title && 
          typeof item.price === 'number' && 
          item.price > 0 && 
          typeof item.guestCount === 'number' && 
          item.guestCount > 0
        ).map((item: any) => ({
          ...item,
          waiterFee: typeof item.waiterFee === 'number' && !isNaN(item.waiterFee) ? item.waiterFee : 0
        }));
        setCartItems(validCart);
        if (validCart.length !== parsedCart.length) {
          localStorage.setItem('cart', JSON.stringify(validCart));
        }
      } catch (error) {
        console.error('Failed to parse cart from localStorage', error);
        localStorage.removeItem('cart');
        setCartItems([]);
      }
    }
    
    // Load pending cart item if exists
    const savedPendingItem = localStorage.getItem('pendingCartItem');
    if (savedPendingItem) {
      try {
        const pendingItem = JSON.parse(savedPendingItem);
        
        // Validação mais rigorosa do item pendente
        if (pendingItem && 
            pendingItem.eventId && 
            pendingItem.title && 
            typeof pendingItem.price === 'number' && 
            pendingItem.price > 0 && 
            typeof pendingItem.guestCount === 'number' && 
            pendingItem.guestCount > 0) {
          setPendingCartItem(pendingItem);
        } else {
          console.error('Pending cart item has invalid data', pendingItem);
          localStorage.removeItem('pendingCartItem');
          setPendingCartItem(null);
        }
      } catch (error) {
        console.error('Failed to parse pending cart item from localStorage', error);
        localStorage.removeItem('pendingCartItem');
        setPendingCartItem(null);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save pending cart item to localStorage whenever it changes
  useEffect(() => {
    if (pendingCartItem) {
      localStorage.setItem('pendingCartItem', JSON.stringify(pendingCartItem));
    } else {
      localStorage.removeItem('pendingCartItem');
    }
  }, [pendingCartItem]);

  // Check if user logs in and there's a pending cart item
  useEffect(() => {
    if (isAuthenticated && pendingCartItem) {
      // Verificar se o item pendente é válido antes de adicioná-lo ao carrinho
      if (pendingCartItem.price && pendingCartItem.guestCount) {
        // Add the pending item to cart now that the user is authenticated
        addItemToCart(pendingCartItem);
        setPendingCartItem(null);
        
        // Show a toast notification that the item was added
        toast.success("Seu item foi adicionado ao carrinho automaticamente!");
        
        // Open the cart to show the user the item was added
        setCartOpen(true);
      } else {
        console.error('Tentativa de adicionar item inválido ao carrinho', pendingCartItem);
        setPendingCartItem(null);
      }
    }
  }, [isAuthenticated, pendingCartItem]);

  const addItemToCart = (item: CartItem) => {
    if (!item.eventId || !item.title || isNaN(Number(item.price)) || isNaN(Number(item.guestCount))) {
      console.error('Tentativa de adicionar item inválido ao carrinho', item);
      return;
    }
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.eventId === item.eventId && 
                  cartItem.date === item.date && 
                  cartItem.menuSelection === item.menuSelection
      );
      const itemWithWaiterFee = {
        ...item,
        waiterFee: calculateWaiterFee(item.guestCount)
      };
      if (existingItemIndex !== -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + item.quantity,
          waiterFee: calculateWaiterFee(item.guestCount)
        };
        return newItems;
      } else {
        return [...prevItems, itemWithWaiterFee];
      }
    });
    setCartOpen(true);
  };

  const addToCart = (item: CartItem) => {
    if (!isAuthenticated) {
      // Apenas salvar o item para adicionar depois se o usuário fizer login
      // Não exibir o modal de login aqui, isso é feito na página de detalhes
      setPendingCartItem(item);
      return;
    }
    
    // User is authenticated, proceed with adding to cart
    addItemToCart(item);
  };

  const removeFromCart = (id: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateCartItemQuantity = (id: number, quantity: number) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id ? { ...item, quantity, waiterFee: item.waiterFee ?? 0 } : item
      )
    );
  };

  const updateCartItem = (updatedItem: CartItem) => {
    setCartItems(prevItems => {
      const newItems = prevItems.map(item =>
        item.id === updatedItem.id
          ? { ...updatedItem, waiterFee: calculateWaiterFee(updatedItem.guestCount) }
          : item
      );
      localStorage.setItem('cart', JSON.stringify(newItems));
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const openCart = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setCartOpen(true);
  };

  const closeCart = () => {
    setCartOpen(false);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      const waiterFee = typeof item.waiterFee === 'number' && !isNaN(item.waiterFee) ? item.waiterFee : 0;
      return total + (item.price * item.quantity) + (waiterFee * item.quantity);
    }, 0);
  };

  const handleLogin = () => {
    // Get current path to return after login
    const currentPath = window.location.pathname + window.location.search;
    setShowLoginModal(false);
    navigate(`/auth?returnTo=${encodeURIComponent(currentPath)}`);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartOpen,
        showLoginModal,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        updateCartItem,
        clearCart,
        openCart,
        closeCart,
        closeLoginModal,
        calculateSubtotal,
      }}
    >
      {children}
      
      {/* Modal de login para usuários não autenticados */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-md p-0 gap-0 flex flex-col">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl font-semibold text-center">
              {t('auth', 'authRequiredTitle')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6">
            <div className="flex items-center justify-center mb-6 text-primary">
              <LogIn size={48} />
            </div>
            
            <p className="text-center font-medium text-gray-800 mb-3">
              {t('auth', 'authRequiredMessage')}
            </p>
            
            <p className="text-center text-gray-500 text-sm mb-6">
              {t('auth', 'authRequiredDescription')}
            </p>
            
            <div className="flex flex-col gap-4">
              <Button 
                className="w-full bg-primary text-white"
                onClick={handleLogin}
              >
                {t('auth', 'loginButton')}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={closeLoginModal}
              >
                {t('auth', 'continueBrowsing')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
