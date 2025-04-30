import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/context/cart-context";
import { Event, Menu, Dish } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { getApiBaseUrl } from "@/lib/queryClient";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Menu as MenuIcon, Clock, Loader2 } from "lucide-react";
import { Select } from "@/components/ui/select";

interface MenuSelection {
  [category: string]: string[];
}

interface EventDetailsModalProps {
  event: Event;
  onClose: () => void;
}

export default function EventDetailsModal({ event, onClose }: EventDetailsModalProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("12:00"); // Horário padrão meio-dia
  const [guestCount, setGuestCount] = useState<number>(20);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [menuItemsLoading, setMenuItemsLoading] = useState(true);
  const [dishes, setDishes] = useState<{ [key: string]: Dish[] }>({});
  const [menuSelections, setMenuSelections] = useState<MenuSelection>({});
  const [categoryLimits, setCategoryLimits] = useState<{[category: string]: number}>({});
  
  const [showMenuOptionsListModal, setShowMenuOptionsListModal] = useState(false);
  const [showItemSelectionModal, setShowItemSelectionModal] = useState(false);
  const [selectedMenuForItems, setSelectedMenuForItems] = useState<Menu | null>(null);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("");

  // Lista de locais e salas agrupados
  const locationOptions = [
    {
      label: "16° Andar - MTC",
      options: [
        "Experience Center",
        "Innovation Factory",
        "Microkitchen Area",
        "MTC Team Only",
        "Tapajos",
        "Tocantins",
        "Xingu"
      ]
    },
    {
      label: "16° Andar - CAFETERIA",
      options: ["MTC Cafeteria"]
    },
    {
      label: "16° Andar - CUSTOMER SPACE",
      options: [
        "Foyer (Verificar Disponibilidade)",
        "Guaporé",
        "Mamoré",
        "MPR Copa Cabana",
        "MPR Paraty",
        "MPR Trancoso",
        "Paraná",
        "Pinheiros",
        "Piracicada",
        "São Francisco",
        "Solimões"
      ]
    }
  ];

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        setMenuItemsLoading(true);
        
        const apiBase = getApiBaseUrl();
        const url = `${apiBase}/api/events/${event.id}/menus`;
        
        console.log(`Carregando menus do evento ${event.id} da URL: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro: ${response.status}`);
        const data = await response.json();
        console.log("Menus carregados:", data);
        setMenus(data);
      } catch (error) {
        console.error("Erro ao carregar menus:", error);
        toast.error("Erro ao carregar menus");
      } finally {
        setMenuItemsLoading(false);
      }
    };

    fetchMenus();
  }, [event.id]);

  const fetchDishesForMenu = async (menuId: number) => {
    try {
      setLoadingDishes(true);
      console.log(`🍽️ DEBUGANDO PRATOS 🍽️`);
      console.log(`Buscando pratos para menu ID: ${menuId}...`);
      
      const apiBase = getApiBaseUrl();
      
      console.log(`Base da API: ${apiBase}`);
      console.log(`URL completa da API: ${apiBase}/api/menus/${menuId}/dishes`);
      
      const response = await fetch(`${apiBase}/api/menus/${menuId}/dishes`);
      console.log(`Status da resposta: ${response.status}`);
      
      // Tentando pegar o texto da resposta original para debug
      const responseText = await response.clone().text();
      console.log("Resposta original (texto):", responseText);
      
      if (!response.ok) throw new Error(`Erro: ${response.status}`);
      
      const data: Dish[] = await response.json();
      console.log("=== PRATOS CARREGADOS ===");
      console.log("Total de pratos:", data.length);
      data.forEach((dish, index) => {
        console.log(`${index + 1}. ${dish.name} (${dish.category}): ${dish.description}`);
      });
      console.log("=========================");
      
      if (data.length === 0) {
        console.log("⚠️ AVISO: Nenhum prato encontrado para este menu!");
        toast.error("Não há pratos cadastrados para este menu.");
        setLoadingDishes(false);
        return;
      }
      
      // Organizar pratos por suas categorias exatas
      const dishCategories: { [category: string]: Dish[] } = {};
      
      // Agrupar pratos por categoria original
      data.forEach(dish => {
        if (!dishCategories[dish.category]) {
          dishCategories[dish.category] = [];
        }
        dishCategories[dish.category].push(dish);
      });
      
      console.log("Pratos agrupados por categoria original:", dishCategories);
      
      // Determinar limites para cada categoria (quantos itens o usuário deve selecionar)
      const limits: {[category: string]: number} = {};
      const categories = Object.keys(dishCategories);
      
      // Definir limites padrão baseados na quantidade de categorias
      if (categories.length <= 3) {
        // Se temos poucas categorias, selecione mais itens de cada
        categories.forEach(cat => {
          limits[cat] = Math.min(3, dishCategories[cat].length);
        });
      } else {
        // Com muitas categorias, selecione menos itens de cada
        categories.forEach(cat => {
          if (cat.includes('BEBIDA')) {
            limits[cat] = 1;
          } else if (cat.includes('SOBREMESA') || cat.includes('BOLOS')) {
            limits[cat] = 1;
          } else if (dishCategories[cat].length <= 2) {
            limits[cat] = 1;
          } else {
            limits[cat] = 2;
          }
        });
      }
      
      setCategoryLimits(limits);
      
      // Inicializar menuSelections com categorias vazias
      const initialSelections: MenuSelection = {};
      Object.keys(dishCategories).forEach(cat => {
        initialSelections[cat] = [];
      });
      
      setMenuSelections(initialSelections);
      setDishes(dishCategories);
    } catch (error) {
      console.error("Erro ao carregar pratos:", error);
      toast.error("Erro ao carregar pratos do menu");
    } finally {
      setLoadingDishes(false);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    if (!selectedMenu || !eventDate || !eventTime) {
      toast.error("Por favor, selecione um menu, uma data e um horário.");
      return;
    }

    const cartItem = {
      id: Date.now(),
      eventId: event.id,
      title: event.title,
      imageUrl: event.imageUrl,
      date: eventDate,
      time: eventTime,
      guestCount,
      location: selectedLocation,
      menuSelection: selectedMenu.name,
      menuItems: menuSelections,
      price: Number(selectedMenu.price) * guestCount,
      quantity: 1
    };

    addToCart(cartItem);
    toast.success(`${event.title} foi adicionado ao seu carrinho.`);
    onClose();
  };

  const handleItemSelection = (category: string, item: string, checked: boolean) => {
    setMenuSelections(prev => {
      const newSelections = { ...prev };
      
      if (!newSelections[category]) {
        newSelections[category] = [];
      }
      
      // Se estiver tentando marcar um novo item
      if (checked) {
        // Verificar se já atingiu o limite para esta categoria
        const currentCount = prev[category]?.length || 0;
        const limit = categoryLimits[category] || 1;
        
        // Se já atingiu o limite, não permite adicionar mais
        if (currentCount >= limit) {
          toast.error(`Você já selecionou o número máximo de ${limit} itens para ${category}`);
          return prev; // Retorna as seleções sem alteração
        }
        
        if (!prev[category]?.includes(item)) {
          newSelections[category] = [...(prev[category] || []), item];
        }
      } else {
        newSelections[category] = (prev[category] || []).filter(i => i !== item);
      }
      return newSelections;
    });
  };

  const isFormValid = () => eventDate && eventTime && guestCount > 0 && selectedMenu && selectedLocation;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0 gap-0">
        <DialogHeader className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">{event.title}</h2>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <img 
                src={event.imageUrl} 
                alt={event.title} 
                className="w-full h-64 object-cover object-top rounded"
              />
              <p className="text-gray-600 mt-4">{event.description}</p>

              <div className="mt-6 space-y-4">
                <div className="flex items-center text-gray-700">
                  <MenuIcon className="mr-3 w-6 h-6" />
                  <span>{menus.length} {menus.length === 1 ? 'opção de menu disponível' : 'opções de menu disponíveis'}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="mr-3 w-6 h-6" />
                  <span>Disponível para agendamento</span>
                </div>
              </div>

              {selectedMenu ? (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Menu Selecionado</h3>
                  <div className="mt-2">
                    <p className="text-gray-700">{selectedMenu.name}</p>
                    <p className="text-sm text-gray-500 mt-1">{selectedMenu.description}</p>
                    <p className="text-primary font-medium mt-2">
                      {formatCurrency(Number(selectedMenu.price))} por pessoa
                    </p>
                    <div className="mt-4 space-y-2">
                      <h4 className="font-medium text-gray-700">Itens Selecionados:</h4>
                      {Object.entries(menuSelections).map(([category, items]) => (
                        items.length > 0 && (
                          <div key={category} className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                              {category}:
                            </p>
                            <ul className="list-disc list-inside text-sm text-gray-500">
                              {items.map((item: string) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="mt-4 w-full"
                      onClick={() => {
                        setSelectedMenuForItems(selectedMenu);
                        fetchDishesForMenu(selectedMenu.id);
                        setShowItemSelectionModal(true);
                      }}
                    >
                      Ver/Editar Itens do Menu
                    </Button>
                  </div>
                </div>
              ) : (
                <Dialog open={showMenuOptionsListModal} onOpenChange={setShowMenuOptionsListModal}>
                <DialogTrigger asChild>
                  <Button 
                    className="mt-6 w-full relative bg-primary text-white hover:bg-opacity-90"
                  >
                    Ver Opções do Menu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                      <h2 className="text-xl font-semibold text-gray-800">Opções de Menu Disponíveis</h2>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                      {menuItemsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : menus && menus.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {menus.map((menu) => (
                            <div key={menu.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden card-shadow">
                          <div className="p-5">
                            <div className="flex justify-between items-center mb-4">
                                  <h3 className="text-lg font-semibold text-gray-800">{menu.name}</h3>
                                  <span className="inline-block bg-emerald-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                                    {formatCurrency(Number(menu.price))}
                              </span>
                            </div>
                            <div className="space-y-3 mb-4">
                              <div className="flex items-start">
                                    <div className="text-gray-600 text-sm">{menu.description}</div>
                              </div>
                            </div>
                            <Button 
                              className="w-full bg-primary text-white"
                              onClick={() => {
                                    setSelectedMenuForItems(menu);
                                    fetchDishesForMenu(menu.id);
                                    setMenuSelections({});
                                    setShowItemSelectionModal(true);
                                    setShowMenuOptionsListModal(false);
                                  }}
                                >
                                  Selecionar Itens deste Menu
                            </Button>
                                                </div>
                                              </div>
                                          ))}
                                        </div>
                      ) : (
                        <p className="text-center py-8 text-gray-600">Nenhuma opção de menu encontrada.</p>
                      )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
            </div>

            <div className="md:w-1/2 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Local
                </label>
                <select
                  className="w-full border rounded px-3 py-2 text-gray-700"
                  value={selectedLocation}
                  onChange={e => setSelectedLocation(e.target.value)}
                  required
                >
                  <option value="">Selecione o local</option>
                  {locationOptions.map(group => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map(option => (
                        <option key={option} value={`${group.label} - ${option}`}>{option}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Evento
                </label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário do Evento
                </label>
                <Input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Convidados
                </label>
                <Input
                  type="number"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 0))}
                  min="1"
                  className="w-full"
                />
              </div>

              {selectedMenu && (
                <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800">Resumo do Pedido</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Menu selecionado:</span>
                      <span className="font-medium">{selectedMenu.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Preço por pessoa:</span>
                      <span className="font-medium">{formatCurrency(Number(selectedMenu.price))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data do evento:</span>
                      <span className="font-medium">{eventDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Horário do evento:</span>
                      <span className="font-medium">{eventTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de convidados:</span>
                      <span className="font-medium">{guestCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Local:</span>
                      <span className="font-medium">{selectedLocation}</span>
                    </div>
                    <div className="text-xs text-amber-700 bg-amber-100 rounded p-2 mt-2">
                      Será cobrado um adicional de <b>R$ 260,00</b> para cada garçom, sendo 1 garçom a cada 10 convidados.
                    </div>
                    {(() => {
                      const garcons = Math.ceil(guestCount / 10);
                      const garcomTotal = garcons * 260;
                      return (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adicional de garçons:</span>
                          <span className="font-medium">{formatCurrency(garcomTotal)} <span className="text-xs text-gray-500">({garcons} garçom{garcons > 1 ? 's' : ''})</span></span>
                        </div>
                      );
                    })()}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span className="text-primary">
                          {(() => {
                            const garcons = Math.ceil(guestCount / 10);
                            const garcomTotal = garcons * 260;
                            return formatCurrency(Number(selectedMenu.price) * guestCount + garcomTotal);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full mt-6 bg-primary text-white"
                onClick={handleAddToCart}
                disabled={!isFormValid()}
              >
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {selectedMenuForItems && (
        <Dialog 
          open={showItemSelectionModal} 
          onOpenChange={() => {
            setShowItemSelectionModal(false);
            setSelectedMenuForItems(null);
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">{selectedMenuForItems?.name}</h2>
              <p className="text-sm text-gray-500">Selecione os itens de cada categoria</p>
            </div>
            
            <div className="overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 160px)" }}>
              {loadingDishes ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                Object.entries(dishes).map(([category, categoryDishes]) => (
                  <div key={category} className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
                      <div>
                        {category}
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          (Selecione {categoryLimits[category] || 1})
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        menuSelections[category]?.length === categoryLimits[category]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {menuSelections[category]?.length || 0} / {categoryLimits[category] || 1}
                      </div>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryDishes.map((dish) => {
                        // Verificar se o usuário já atingiu o limite para esta categoria
                        const isMaxSelected = (menuSelections[category]?.length || 0) >= (categoryLimits[category] || 1);
                        const isSelected = menuSelections[category]?.includes(dish.name) || false;
                        // Só bloquear novos itens se o item atual não estiver selecionado e já atingiu o limite
                        const isDisabled = isMaxSelected && !isSelected;
                        
                        return (
                          <label 
                            key={dish.id} 
                            className={`relative border rounded-lg overflow-hidden block cursor-pointer hover:border-primary transition-colors group ${
                              isDisabled ? 'opacity-50 cursor-not-allowed' : 'has-[:checked]:border-primary has-[:checked]:ring-2 has-[:checked]:ring-primary/50'
                            } h-full flex flex-col`}
                          >
                            <input 
                              type="checkbox" 
                              name={category}
                              className="peer absolute top-2 right-2 opacity-0 w-0 h-0"
                              checked={isSelected}
                              onChange={(e) => handleItemSelection(category, dish.name, e.target.checked)}
                              disabled={isDisabled}
                            />
                            {dish.imageUrl ? (
                              <div className="h-40 w-full overflow-hidden">
                                <img 
                                  src={dish.imageUrl} 
                                  alt={dish.name} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                />
                              </div>
                            ) : (
                              <div className="h-24 w-full bg-gray-100 flex items-center justify-center">
                                <span className="text-gray-400">Sem imagem</span>
                              </div>
                            )}
                            <div className="p-4 flex-grow flex flex-col">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium text-gray-800 text-lg">{dish.name}</h4>
                                <div className={`w-7 h-7 border-2 rounded-full flex items-center justify-center transition-all duration-200 ${
                                  menuSelections[category]?.includes(dish.name)
                                    ? "bg-primary border-primary shadow-md"
                                    : "border-gray-300"
                                }`}>
                                  {menuSelections[category]?.includes(dish.name) && (
                                    <svg 
                                      xmlns="http://www.w3.org/2000/svg" 
                                      className="h-5 w-5 text-white"
                                      viewBox="0 0 24 24" 
                                      fill="none"
                                      stroke="currentColor" 
                                      strokeWidth={3.5}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-sm text-gray-600 flex-grow mb-2">{dish.description}</p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 mt-auto">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowItemSelectionModal(false);
                  setSelectedMenuForItems(null);
                }}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-primary text-white"
                onClick={() => {
                  // Verificar se as seleções estão corretas
                  const selectionCounts = Object.entries(menuSelections).map(([category, items]) => ({
                    category,
                    count: items.length,
                    required: categoryLimits[category] || 1
                  }));
                  
                  const invalids = selectionCounts.filter(item => item.count !== item.required);
                  
                  if (invalids.length === 0) {
                    setSelectedMenu(selectedMenuForItems);
                    setShowItemSelectionModal(false);
                    setSelectedMenuForItems(null);
                    toast.success(`Itens para ${selectedMenuForItems?.name} confirmados.`);
                  } else {
                    const mensagens = invalids.map(item => 
                      `${item.category}: selecione exatamente ${item.required} (atualmente: ${item.count})`
                    );
                    
                    toast.error(
                      "Selecione a quantidade exata de itens em cada categoria:\n" + mensagens.join('\n')
                    );
                  }
                }}
              >
                Confirmar Seleção
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showLoginModal && (
        <Dialog 
          open={showLoginModal} 
          onOpenChange={setShowLoginModal}
        >
          <DialogContent className="max-w-md p-0 gap-0 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-white">
              <h2 className="text-xl font-semibold text-gray-800">Login Necessário</h2>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-center mb-4 text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
                </svg>
              </div>
              
              <p className="text-center text-gray-800 mb-2 font-medium">
                Você precisa estar logado para adicionar itens ao carrinho
              </p>
              
              <p className="text-center text-gray-600 text-sm mb-6">
                Clique no botão abaixo para fazer login e continuar sua compra
              </p>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowLoginModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="bg-primary text-white"
                onClick={() => {
                  setShowLoginModal(false);
                  onClose();
                  // Salvar os dados do pedido para recuperar depois
                  const pendingItem = {
                    id: Date.now(), // Garantir que tenha um id único
                    eventId: event.id,
                    title: event.title,
                    imageUrl: event.imageUrl,
                    date: eventDate || "",
                    time: eventTime || "",
                    guestCount: Number(guestCount) || 20,
                    location: selectedLocation,
                    menuSelection: selectedMenu?.name || "",
                    menuItems: menuSelections || {},
                    price: selectedMenu ? Number(selectedMenu.price) * (Number(guestCount) || 20) : 0,
                    quantity: 1
                  };
                  
                  localStorage.setItem('pendingCartItem', JSON.stringify(pendingItem));
                  
                  // Redirecionar para a página de login com retorno para a página atual
                  const returnUrl = encodeURIComponent(window.location.pathname);
                  window.location.href = `/auth?returnTo=${returnUrl}`;
                }}
              >
                Ir para Login
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}