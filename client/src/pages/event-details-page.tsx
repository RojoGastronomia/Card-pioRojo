import { useState, useEffect } from "react";
import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { Event, Menu, Dish } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar, 
  Users, 
  Clock, 
  MenuSquare,
  ArrowLeft,
  Loader2,
  Check,
  LogIn
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/context/language-context";

// Função imperativa para criar o modal fora do React
function showImperativeLoginModal(onLogin: () => void) {
  // Remover modal existente se houver
  const existingModal = document.getElementById('imperative-login-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }

  // Criar container do modal
  const modalContainer = document.createElement('div');
  modalContainer.id = 'imperative-login-modal';
  modalContainer.style.position = 'fixed';
  modalContainer.style.top = '0';
  modalContainer.style.left = '0';
  modalContainer.style.right = '0';
  modalContainer.style.bottom = '0';
  modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
  modalContainer.style.display = 'flex';
  modalContainer.style.alignItems = 'center';
  modalContainer.style.justifyContent = 'center';
  modalContainer.style.zIndex = '999999';

  // Criar conteúdo do modal
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'white';
  modalContent.style.padding = '24px';
  modalContent.style.borderRadius = '8px';
  modalContent.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  modalContent.style.width = '90%';
  modalContent.style.maxWidth = '450px';
  modalContent.style.position = 'relative';

  // Título
  const title = document.createElement('h2');
  title.textContent = t('eventDetails', 'loginRequired');
  title.style.fontSize = '20px';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '16px';

  // Mensagem
  const message = document.createElement('p');
  message.textContent = t('eventDetails', 'loginToAddToCart');
  message.style.marginBottom = '16px';

  // Container para botões
  const buttonContainer = document.createElement('div');
  buttonContainer.style.marginTop = '24px';
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';

  // Botão cancelar
  const cancelButton = document.createElement('button');
  cancelButton.textContent = t('common', 'cancel');
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.border = '1px solid #d1d5db';
  cancelButton.style.borderRadius = '6px';
  cancelButton.style.backgroundColor = 'white';
  cancelButton.addEventListener('click', () => {
    document.body.removeChild(modalContainer);
  });

  // Botão login
  const loginButton = document.createElement('button');
  loginButton.textContent = t('eventDetails', 'goToLogin');
  loginButton.style.padding = '8px 16px';
  loginButton.style.backgroundColor = '#2563eb';
  loginButton.style.color = 'white';
  loginButton.style.borderRadius = '6px';
  loginButton.style.border = 'none';
  loginButton.addEventListener('click', () => {
    document.body.removeChild(modalContainer);
    onLogin();
  });

  // Montar o modal
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(loginButton);

  modalContent.appendChild(title);
  modalContent.appendChild(message);
  modalContent.appendChild(buttonContainer);

  modalContainer.appendChild(modalContent);
  document.body.appendChild(modalContainer);
}

export default function EventDetailsPage() {
  const [, params] = useRoute("/events/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { t, language } = useLanguage();
  
  // Log do estado de autenticação quando o componente é montado
  useEffect(() => {
    console.log("🔐 Estado de autenticação:", isAuthenticated ? "AUTENTICADO" : "NÃO AUTENTICADO");
    
    // INJEÇÃO DE SCRIPT DE EMERGÊNCIA - só executa quando não autenticado
    if (!isAuthenticated) {
      // Criar script para ser injetado
      const script = document.createElement('script');
      script.innerHTML = `
        // Função para substituir o botão de adicionar ao carrinho
        function substituirBotaoCarrinho() {
          console.log("🔍 Procurando botão...");
          
          // Encontrar todos os botões da página
          const botoes = document.querySelectorAll('button');
          
          // Verificar cada botão
          botoes.forEach(function(botao) {
            // Se o botão contém o texto "Adicionar ao Carrinho"
            if (botao && botao.textContent && botao.textContent.includes('Adicionar ao Carrinho')) {
              console.log("✅ Botão encontrado! Substituindo...");
              
              // Criar div com link de login
              const loginLink = document.createElement('div');
              loginLink.innerHTML = '<div style="margin-top: 20px; padding: 15px; background-color: #EFF6FF; border: 2px dashed #3B82F6; border-radius: 5px; text-align: center;"><p style="margin-bottom: 10px; font-weight: bold; color: #1E40AF;">Login necessário para continuar</p><a href="/auth" style="display: block; background-color: #2563EB; color: white; padding: 10px; border-radius: 5px; text-decoration: none; font-weight: bold;">FAZER LOGIN</a></div>';
              
              // Substituir o botão pelo link
              if (botao.parentNode) {
                botao.parentNode.replaceChild(loginLink, botao);
                console.log("✅ Botão substituído com sucesso!");
              }
            }
          });
        }
        
        // Executar a substituição quando a página terminar de carregar
        window.addEventListener('load', function() {
          console.log("🚀 Página carregada - Executando substituição inicial");
          substituirBotaoCarrinho();
          
          // Tentar novamente após meio segundo
          setTimeout(substituirBotaoCarrinho, 500);
          
          // Tentar novamente após 1 segundo
          setTimeout(substituirBotaoCarrinho, 1000);
          
          // Tentar novamente após 2 segundos
          setTimeout(substituirBotaoCarrinho, 2000);
        });
      `;
      
      // Adicionar script ao documento
      document.head.appendChild(script);
      
      return () => {
        // Remover script quando o componente for desmontado
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
      };
    }
  }, [isAuthenticated]);
  
  const eventId = params?.id ? parseInt(params.id) : null;
  
  const [eventDate, setEventDate] = useState("");
  const [guestCount, setGuestCount] = useState(20);
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Fetch event details
  const { data: event, isLoading: eventLoading } = useQuery<Event>({
    queryKey: ["/api/events", eventId, language],
    enabled: !!eventId,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}?lang=${language}`);
      if (!response.ok) throw new Error("Failed to fetch event");
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error loading event",
        description: error.message,
        variant: "destructive",
      });
    }
  } as UseQueryOptions<Event>);
  
  // Fetch menus for this event
  const { data: menus, isLoading: menusLoading } = useQuery<Menu[]>({
    queryKey: ["/api/events", eventId, "menus", language],
    enabled: !!eventId,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/api/events/${eventId}/menus?lang=${language}`);
      if (!response.ok) throw new Error("Failed to fetch menus");
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error loading menus",
        description: error.message,
        variant: "destructive",
      });
    }
  } as UseQueryOptions<Menu[]>);

  // Fetch dishes for selected menu
  const { data: dishes, isLoading: dishesLoading } = useQuery<Dish[]>({
    queryKey: ["/api/menus", selectedMenuId, "dishes", language],
    enabled: !!selectedMenuId,
    retry: false,
    queryFn: async () => {
      const response = await fetch(`/api/menus/${selectedMenuId}/dishes?lang=${language}`);
      if (!response.ok) throw new Error("Failed to fetch dishes");
      return response.json();
    },
    onError: (error: Error) => {
      toast({
        title: "Error loading dishes",
        description: error.message,
        variant: "destructive",
      });
    }
  } as UseQueryOptions<Dish[]>);
  
  const selectedMenu = menus?.find((menu: Menu) => menu.id.toString() === selectedMenuId);
  
  const calculateTotal = () => {
    if (!selectedMenu || !guestCount) return 0;
    // Garantir que price seja tratado como número
    const price = typeof selectedMenu.price === 'number' ? selectedMenu.price : 0;
    return price * guestCount;
  };
  
  // Adicional de garçons
  const WAITER_UNIT_PRICE = 260;
  const calculateWaiterFee = () => {
    if (!guestCount) return 0;
    const numWaiters = Math.ceil(guestCount / 10);
    return numWaiters * WAITER_UNIT_PRICE;
  };

  const calculateTotalWithWaiter = () => {
    return calculateTotal() + calculateWaiterFee();
  };
  
  const isFormValid = () => {
    return eventDate && guestCount > 0 && selectedMenuId;
  };
  
  const handleAddToCart = async () => {
    console.log("🛒 Função handleAddToCart chamada");
    
    // Verificar dados básicos
    if (!isFormValid()) {
      toast({
        title: t('eventDetails', 'fixErrors'),
        description: t('eventDetails', 'selectMenuToContinue'),
        variant: "destructive"
      });
      return;
    }
    
    console.log("🔐 Estado de autenticação ao adicionar:", isAuthenticated ? "AUTENTICADO" : "NÃO AUTENTICADO");
    
    // Se não estiver autenticado - SOLUÇÃO SIMPLES: redirecionar para a página de login
    if (!isAuthenticated) {
      console.log("👤 Usuário não autenticado - redirecionando para login");
      
      // Salvar item pendente
      if (event && selectedMenu && eventDate) {
        const pendingItem = {
          id: Date.now(),
          eventId: event.id,
          title: event.title,
          imageUrl: event.imageUrl,
          date: eventDate,
          guestCount,
          menuSelection: selectedMenu.name,
          price: calculateTotal(),
          waiterFee: calculateWaiterFee(),
          quantity: 1
        };
        
        localStorage.setItem('pendingCartItem', JSON.stringify(pendingItem));
      }
      
      // Mostrar toast e navegar para a página de login
      toast({
        title: t('eventDetails', 'loginRequired'),
        description: t('eventDetails', 'redirectingToLogin')
      });
      
      // Navegar para a página de login após um breve delay
      setTimeout(() => {
        navigate("/auth");
      }, 1500);
      
      return;
    }
    
    // Usuário autenticado, continuar com adição ao carrinho
    setIsAddingToCart(true);
    
    try {
    const cartItem = {
      id: Date.now(),
      eventId: event.id,
      title: event.title,
      imageUrl: event.imageUrl,
      date: eventDate,
      guestCount,
      menuSelection: selectedMenu.name,
      price: calculateTotal(),
      waiterFee: calculateWaiterFee(),
      quantity: 1
    };
    
      // Adicionar ao carrinho
    addToCart(cartItem);
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    
    toast({
      title: "Adicionado ao carrinho",
      description: `${event.title} foi adicionado ao seu carrinho.`,
    });
    } catch (error) {
      toast({
        title: "Erro ao adicionar ao carrinho",
        description: "Ocorreu um erro ao adicionar o item ao carrinho. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  // Set min date to tomorrow
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };
  
  // Fallback para título e descrição
  const eventTitle = event?.title || event?.titlePt || 'Sem título';
  const eventDescription = event?.description || event?.descriptionPt || 'Sem descrição';
  
  if (!eventId) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700">{t('eventDetails', 'eventNotFound')}</h3>
          <Button onClick={() => navigate("/events")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> {t('eventDetails', 'backToEvents')}
          </Button>
        </div>
      </main>
    );
  }
  
  console.log("RENDER guestCount:", guestCount);
  console.log("RENDER waiterFee calculado:", calculateWaiterFee());
  
  console.log("==== EVENT DETAILS PAGE RENDERIZADO ====");
  
  return (
      <main className="container mx-auto px-4 py-8">
        {/* Adicionar barra de status de login no topo */}
        {!isAuthenticated && (
          <div className="bg-blue-50 border border-blue-200 p-4 mb-6 rounded-md flex justify-between items-center">
            <div className="text-blue-700 flex items-center">
              <LogIn className="h-5 w-5 mr-2" />
              <span>{t('eventDetails', 'loginRequiredForOrders')}</span>
            </div>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate("/auth")}
            >
              {t('auth', 'login')}
            </Button>
          </div>
        )}

        <Button 
          onClick={() => navigate("/events")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('eventDetails', 'backToEvents')}
        </Button>
        
        {eventLoading ? (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <Skeleton className="w-full h-64 rounded-lg mb-4" />
              <Skeleton className="w-3/4 h-8 mb-2" />
              <Skeleton className="w-full h-4 mb-1" />
              <Skeleton className="w-full h-4 mb-1" />
              <Skeleton className="w-2/3 h-4 mb-6" />
              <div className="space-y-4">
                <Skeleton className="w-full h-6" />
                <Skeleton className="w-full h-6" />
              </div>
            </div>
            <div className="md:w-1/2 space-y-6">
              <Skeleton className="w-full h-24" />
              <Skeleton className="w-full h-24" />
              <Skeleton className="w-full h-24" />
              <Skeleton className="w-full h-12" />
            </div>
          </div>
        ) : event ? (
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2">
              <img 
                src={event.imageUrl} 
                alt={event.translatedTitle} 
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
              <h1 className="text-2xl font-bold text-gray-800 mb-4">{event.translatedTitle}</h1>
              <p className="text-gray-600 mb-6">{event.translatedDescription}</p>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <MenuSquare className="mr-3 w-5 h-5" />
                  <span>{t('eventDetails', 'menuOptionsAvailable', { count: event.menuOptions })}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="mr-3 w-5 h-5" />
                  <span>{t('eventDetails', 'availableForBooking')}</span>
                </div>
              </div>
              
            {menusLoading ? (
                <div className="space-y-4">
                  <Skeleton className="w-full h-20" />
                  <Skeleton className="w-full h-20" />
                </div>
            ) : menus && menus.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800">{t('eventDetails', 'menuOptions')}</h3>
                {menus.map(menu => (
                  <div 
                    key={menu.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedMenuId === menu.id.toString() 
                        ? 'border-emerald-600 shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    onClick={() => setSelectedMenuId(menu.id.toString())}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-gray-900">{menu.name}</h4>
                        <p className="text-gray-600 text-sm mt-1">{menu.description}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block bg-emerald-600 text-white text-sm font-medium px-3 py-1 rounded-full"> 
                          {formatCurrency(Number(menu.price))}
                        </span>
                      </div>
                    </div>
                    
                    {selectedMenuId === menu.id.toString() ? (
                      <div className="mt-4 border-t pt-4">
                        <h5 className="font-medium mb-3 text-gray-800">Pratos inclusos:</h5>
                        {dishesLoading ? (
                          <div className="space-y-2">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-full h-4" />
                          </div>
                        ) : dishes && dishes.length > 0 ? (
                          <div className="space-y-6">
                            {Object.entries(
                              dishes.reduce((acc, dish) => {
                                if (!acc[dish.category]) {
                                  acc[dish.category] = [];
                                }
                                acc[dish.category].push(dish);
                                return acc;
                              }, {} as Record<string, typeof dishes>)
                            ).map(([category, categoryDishes]) => (
                              <div key={category} className="bg-white rounded-md p-3">
                                <h6 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
                                  <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mr-2"></span>
                                  {category}
                                </h6>
                                <ul className="space-y-2.5">
                                  {categoryDishes.map(dish => (
                                    <li key={dish.id} className="text-sm text-gray-600 flex items-start">
                                      <span className="mr-2 text-emerald-600">•</span>
                                      <div>
                                        <span className="font-medium text-gray-800">{dish.name}</span>
                                        {dish.description && (
                                          <p className="text-xs text-gray-500 mt-0.5">{dish.description}</p>
                                        )}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">{t('eventDetails', 'noDishesAvailable')}</p>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 pt-4 border-t">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMenuId(menu.id.toString());
                          }}
                          className="w-full py-2 px-4 border border-emerald-600 text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors font-medium"
                        >
                          Selecionar este Menu
                        </button>
                      </div>
                    )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">{t('eventDetails', 'noMenuOptions')}</p>
                </div>
              )}
            </div>
            
            <div className="md:w-1/2 space-y-6">
            <div className="p-6 border rounded-lg bg-white shadow-sm">
              <h3 className="text-lg font-medium text-gray-800 mb-4">{t('eventDetails', 'orderDetails')}</h3>
              
              <div className="space-y-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('eventDetails', 'eventDate')}
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                      min={getMinDate()}
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                      className={`pl-10 w-full ${!eventDate && 'border-red-300 focus:ring-red-500'}`}
                    />
                  </div>
                  {!eventDate && (
                    <p className="text-xs text-red-500 mt-1">
                      {t('eventDetails', 'selectEventDate')}
                    </p>
                  )}
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('eventDetails', 'numberOfGuests')}
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    type="number"
                      min={20}
                    value={guestCount}
                    onChange={(e) => {
                      const value = e.target.value;
                      const parsedValue = parseInt(value);
                      if (!isNaN(parsedValue)) {
                        setGuestCount(parsedValue);
                      } else {
                        setGuestCount(20); 
                      }
                    }}
                      className={`pl-10 w-full ${guestCount < 20 && 'border-red-300 focus:ring-red-500'}`}
                    />
                  </div>
                  {guestCount < 20 ? (
                    <p className="text-xs text-red-500 mt-1">
                      {t('eventDetails', 'minimumGuestsError')}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">
                      {t('eventDetails', 'minimumGuestsInfo')}
                    </p>
                  )}
                </div>
              </div>
              
              {!selectedMenuId && (
                <p className="text-xs text-red-500 mt-4">
                  {t('eventDetails', 'selectMenuToContinue')}
                </p>
              )}
              
              {selectedMenu && (
                <div className="mt-6 pt-6 border-t">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{t('eventDetails', 'pricePerPerson')}:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(Number(selectedMenu.price))}</span>
                </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">{t('eventDetails', 'numberOfGuests')}:</span>
                      <span className="font-medium text-gray-900">{guestCount}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{t('eventDetails', 'waiterFee')}:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(calculateWaiterFee())}</span>
                </div>
                    <div className="flex justify-between items-center text-lg font-medium pt-3 border-t">
                      <span className="text-gray-800">{t('eventDetails', 'total')}:</span>
                      <span className="font-semibold text-emerald-600">{formatCurrency(Number(calculateTotalWithWaiter()))}</span>
                </div>
              </div>
              
              {/* Botão de Adicionar ao Carrinho ou Login */}
              {isAuthenticated ? (
              <Button
                  className="w-full mt-6 relative bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 text-lg"
                  disabled={isAddingToCart || showSuccess || !isFormValid()}
                onClick={handleAddToCart}
              >
                  <span className={`transition-opacity duration-200 ${showSuccess ? 'opacity-0' : 'opacity-100'}`}>
                    {isAddingToCart ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('eventDetails', 'addingToCart')}
                      </>
                    ) : (
                      t('eventDetails', 'addToCart')
                    )}
                  </span>
                  {showSuccess && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <Check className="mr-2 h-5 w-5" />
                      {t('eventDetails', 'addedToCart')}
                    </span>
                  )}
                </Button>
              ) : (
                <div className="mt-6">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mb-4">
                    <p className="text-blue-700 font-medium mb-2">{t('eventDetails', 'loginRequiredForCart')}</p>
                    <p className="text-blue-600 text-sm">{t('eventDetails', 'selectionsPreserved')}</p>
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      // Salvar item pendente
                      if (event && selectedMenu && eventDate) {
                        const pendingItem = {
                          id: Date.now(),
                          eventId: event.id,
                          title: event.title,
                          imageUrl: event.imageUrl,
                          date: eventDate,
                          guestCount,
                          menuSelection: selectedMenu.name,
                          price: calculateTotal(),
                          waiterFee: calculateWaiterFee(),
                          quantity: 1
                        };
                        
                        localStorage.setItem('pendingCartItem', JSON.stringify(pendingItem));
                      }
                      
                      // Navegar para login
                      navigate("/auth");
                    }}
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {t('eventDetails', 'loginToContinue')}
              </Button>
                </div>
              )}
                  
                  {!isFormValid() && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md">
                      <p className="text-sm text-red-800 font-medium">{t('eventDetails', 'fixErrors')}:</p>
                      <ul className="mt-2 text-xs text-red-700 list-disc list-inside">
                        {!eventDate && <li>{t('eventDetails', 'selectEventDate')}</li>}
                        {guestCount < 20 && <li>{t('eventDetails', 'minimumGuestsError')}</li>}
                        {!selectedMenuId && <li>{t('eventDetails', 'selectMenu')}</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </div>
      ) : null}
      </main>
  );
}
