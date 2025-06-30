import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dish, Event, Menu } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRoute } from "wouter";
import { useLocation } from "wouter";
import { Search, Link, ArrowLeft, Plus, Trash2, ChefHat } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Checkbox,
} from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function AdminMenusPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/admin/menus/:menuId/dishes");
  const [, setLocation] = useLocation();
  const menuId = params?.menuId ? parseInt(params.menuId) : null;
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Estados para o modal de vincular pratos
  const [showLinkDishesDialog, setShowLinkDishesDialog] = useState(false);
  const [selectedDishesToLink, setSelectedDishesToLink] = useState<number[]>([]);
  const [searchTermLink, setSearchTermLink] = useState("");
  const [categoryFilterLink, setCategoryFilterLink] = useState<string | null>(null);

  // Estado para lista infinita
  const [visibleItems, setVisibleItems] = useState(10);
  const itemsPerPage = 10;

  // UseEffect to reset visibleItems when filters change
  useEffect(() => {
    setVisibleItems(10);
  }, [searchTerm, categoryFilter]);

  // Fetch current menu data
  const { 
    data: currentMenu,
    isLoading: menuLoading
  } = useQuery<Menu>({
    queryKey: ["/api/menus", menuId],
    queryFn: () => apiRequest("GET", `/api/menus/${menuId}`).then(res => res.json()),
    enabled: !!menuId,
  });

  // Fetch Dishes for the specific menuId
  const { 
    data: dishes,
    isLoading: dishesLoading,
    isError: dishesError,
    error: dishesFetchError
  } = useQuery<Dish[]>({
    queryKey: ["/api/menus", menuId, "dishes"],
    queryFn: () => apiRequest("GET", `/api/menus/${menuId}/dishes`).then(res => res.json()),
    enabled: !!menuId,
  });

  // Fetch all dishes in the system for linking
  const { 
    data: allDishes = [], 
    isLoading: allDishesLoading 
  } = useQuery<Dish[]>({
    queryKey: ["/api/dishes"],
    queryFn: () => apiRequest("GET", "/api/dishes").then(res => res.json()),
  });

  // Fetch events (for dropdown)
  const { 
    data: events, 
    isError: eventsError, 
    error: eventsFetchError 
  } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  // Filter dishes based on search term and category
  const filteredDishes = dishes?.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dish.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || dish.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter all dishes for linking (excluding already linked dishes)
  const availableDishesForLinking = allDishes.filter(dish => {
    // Excluir pratos que já estão vinculados ao menu atual
    const isAlreadyLinked = dishes?.some(linkedDish => linkedDish.id === dish.id);
    
    const matchesSearch = dish.name.toLowerCase().includes(searchTermLink.toLowerCase()) ||
                         dish.description.toLowerCase().includes(searchTermLink.toLowerCase());
    const matchesCategory = !categoryFilterLink || dish.category === categoryFilterLink;
    
    return !isAlreadyLinked && matchesSearch && matchesCategory;
  });

  // Associate dishes with menu mutation
  const associateDishesMutation = useMutation({
    mutationFn: async (dishIds: number[]) => {
      if (!menuId) throw new Error("Menu ID is missing");
      
      // Associar cada prato ao menu usando a API correta
      const promises = dishIds.map(dishId => 
        apiRequest("POST", `/api/menus/${menuId}/dishes/${dishId}`)
      );
      
      await Promise.all(promises);
      return dishIds;
    },
    onSuccess: (dishIds) => {
      setShowLinkDishesDialog(false);
      setSelectedDishesToLink([]);
      queryClient.invalidateQueries({ queryKey: ["/api/menus", menuId, "dishes"] });
      toast({
        title: "Pratos adicionados ao menu",
        description: `${dishIds.length} prato(s) adicionado(s) ao menu com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar pratos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove dish from menu mutation
  const removeDishMutation = useMutation({
    mutationFn: async (dishId: number) => {
      if (!menuId) throw new Error("Menu ID is missing");
      
      // Remover prato do menu
      return apiRequest("DELETE", `/api/menus/${menuId}/dishes/${dishId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menus", menuId, "dishes"] });
      toast({
        title: "Prato removido",
        description: "Prato removido do menu com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover prato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle dish selection for linking
  const handleDishSelection = (dishId: number, checked: boolean) => {
    if (checked) {
      setSelectedDishesToLink(prev => [...prev, dishId]);
    } else {
      setSelectedDishesToLink(prev => prev.filter(id => id !== dishId));
    }
  };

  // Handle linking selected dishes
  const handleLinkSelectedDishes = () => {
    if (selectedDishesToLink.length === 0) {
      toast({
        title: "Nenhum prato selecionado",
        description: "Selecione pelo menos um prato para adicionar ao menu.",
        variant: "destructive",
      });
      return;
    }
    
    associateDishesMutation.mutate(selectedDishesToLink);
  };

  // Handle removing dish from menu
  const handleRemoveDish = (dishId: number, dishName: string) => {
    if (window.confirm(`Tem certeza que deseja remover "${dishName}" deste menu?`)) {
      removeDishMutation.mutate(dishId);
    }
  };

  // Get category display text
  const getCategoryDisplay = (category: string) => {
    switch (category) {
      case "appetizer":
        return "Entrada";
      case "main":
        return "Prato Principal";
      case "dessert":
        return "Sobremesa";
      case "BEBIDAS":
        return "Bebidas";
      default:
        return category;
    }
  };

  // 2. Calcular pratos da página atual (agora depois dos hooks)
  const paginatedDishes = filteredDishes?.slice(0, visibleItems) || [];
  const totalPages = filteredDishes ? Math.ceil(filteredDishes.length / itemsPerPage) : 1;

  // 3. Funções de navegação para lista infinita
  const loadMoreItems = () => {
    if (filteredDishes && visibleItems < filteredDishes.length) {
      setVisibleItems(prev => Math.min(prev + itemsPerPage, filteredDishes.length));
    }
  };

  // Função para detectar quando o usuário chegou ao final da lista
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 5) { // 5px de margem
      loadMoreItems();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header com botão voltar e informações do menu */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin/menus-crud")}
          className="mb-4 gap-2"
        >
          <ArrowLeft size={16} />
          Voltar para Gerenciar Menus
        </Button>
        
        {menuLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        ) : currentMenu ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ChefHat className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                Gerenciar Pratos do Menu: {currentMenu.name}
              </h1>
            </div>
            <p className="text-gray-600">
              {currentMenu.description} • {formatCurrency(currentMenu.price)} por pessoa
            </p>
            <p className="text-sm text-gray-500">
              Adicione ou remova pratos deste menu específico. Os pratos aqui listados são exclusivos deste menu.
            </p>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-gray-900">
            Gerenciar Pratos do Menu
          </h1>
        )}
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <p className="text-sm text-blue-800 font-medium">
              {dishes?.length || 0} prato(s) no menu
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setShowLinkDishesDialog(true);
              setSelectedDishesToLink([]);
              setSearchTermLink("");
              setCategoryFilterLink(null);
            }}
            className="gap-2"
            disabled={!menuId}
          >
            <Plus size={16} />
            Adicionar Pratos ao Menu
          </Button>
        </div>
      </div>

      {/* Verificar se há menu selecionado */}
      {!menuId ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Menu não encontrado
              </h2>
              <p className="text-gray-600 mb-4">
                O menu especificado não foi encontrado ou não existe.
              </p>
              <Button
                onClick={() => setLocation("/admin/menus-crud")}
                className="gap-2"
              >
                <ArrowLeft size={16} />
                Voltar para Gerenciar Menus
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filter Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex flex-wrap gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        {categoryFilter ? getCategoryDisplay(categoryFilter) : "Filtrar por Categoria"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setCategoryFilter(null)}>
                        Todas as categorias
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategoryFilter("appetizer")}>
                        Entrada
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategoryFilter("main")}>
                        Prato Principal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategoryFilter("dessert")}>
                        Sobremesa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setCategoryFilter("BEBIDAS")}>
                        Bebidas
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    type="text"
                    placeholder="Buscar pratos no menu..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-64 pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dishes Table */}
          <Card className="mt-6">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Pratos do Menu
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Estes são os pratos que estão atualmente incluídos neste menu.
                </p>
              </div>
              
              {dishesLoading ? (
                <div className="p-4">
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-20 w-full mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : filteredDishes && filteredDishes.length > 0 ? (
                <div style={{ maxHeight: 420, overflowY: 'auto' }} onScroll={handleScroll}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome do Prato</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedDishes.map((dish: Dish) => (
                        <TableRow key={dish.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{dish.name}</TableCell>
                          <TableCell>{getCategoryDisplay(dish.category)}</TableCell>
                          <TableCell>{formatCurrency(dish.price)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDish(dish.id, dish.name)}
                              disabled={removeDishMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {/* Indicador de carregamento */}
                  {visibleItems < (filteredDishes?.length || 0) && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">
                        Mostrando {visibleItems} de {filteredDishes?.length} pratos. 
                        Role para carregar mais...
                      </p>
                    </div>
                  )}
                  {visibleItems >= (filteredDishes?.length || 0) && filteredDishes && filteredDishes.length > 0 && (
                    <div className="text-center py-4">
                      <p className="text-gray-500">
                        Mostrando todos os {filteredDishes.length} pratos do menu.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">Este menu ainda não possui pratos.</p>
                  <p className="text-sm text-gray-400 mb-4">
                    Clique em "Adicionar Pratos ao Menu" para começar a montar seu cardápio.
                  </p>
                  <Button
                    onClick={() => {
                      setShowLinkDishesDialog(true);
                      setSelectedDishesToLink([]);
                      setSearchTermLink("");
                      setCategoryFilterLink(null);
                    }}
                    className="gap-2"
                  >
                    <Plus size={16} />
                    Adicionar Primeiro Prato
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Link Dishes Dialog */}
      <Dialog open={showLinkDishesDialog} onOpenChange={setShowLinkDishesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Pratos ao Menu</DialogTitle>
            <p className="text-sm text-gray-600 mt-2">
              Selecione os pratos que você deseja adicionar ao menu "{currentMenu?.name}".
              Apenas pratos que ainda não estão no menu são mostrados.
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Filtros para busca */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar pratos por nome ou descrição..."
                  value={searchTermLink}
                  onChange={(e) => setSearchTermLink(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {categoryFilterLink ? getCategoryDisplay(categoryFilterLink) : "Filtrar por Categoria"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setCategoryFilterLink(null)}>
                    Todas as categorias
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilterLink("appetizer")}>
                    Entrada
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilterLink("main")}>
                    Prato Principal
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilterLink("dessert")}>
                    Sobremesa
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setCategoryFilterLink("BEBIDAS")}>
                    Bebidas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Lista de pratos disponíveis */}
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="mb-3">
                <h3 className="font-medium text-gray-900">Pratos Disponíveis para Adicionar</h3>
                <p className="text-sm text-gray-600">
                  {availableDishesForLinking.length} prato(s) encontrado(s)
                </p>
              </div>
              
              {allDishesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : availableDishesForLinking.length > 0 ? (
                <div className="space-y-2">
                  {availableDishesForLinking.map((dish) => (
                    <div key={dish.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
                      <Checkbox
                        checked={selectedDishesToLink.includes(dish.id)}
                        onCheckedChange={(checked) => handleDishSelection(dish.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{dish.name}</p>
                        <p className="text-sm text-gray-500">{dish.description}</p>
                        <p className="text-sm text-gray-600">
                          {getCategoryDisplay(dish.category)} • {formatCurrency(dish.price)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-2">
                    {searchTermLink || categoryFilterLink 
                      ? "Nenhum prato encontrado com os filtros aplicados."
                      : "Todos os pratos já estão neste menu."
                    }
                  </p>
                  {searchTermLink || categoryFilterLink && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSearchTermLink("");
                        setCategoryFilterLink(null);
                      }}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Contador de selecionados */}
            {selectedDishesToLink.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium">
                  {selectedDishesToLink.length} prato(s) selecionado(s) para adicionar ao menu
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDishesDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleLinkSelectedDishes}
              disabled={selectedDishesToLink.length === 0 || associateDishesMutation.isPending}
              className="gap-2"
            >
              {associateDishesMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Adicionando...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Adicionar {selectedDishesToLink.length} Prato(s) ao Menu
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 