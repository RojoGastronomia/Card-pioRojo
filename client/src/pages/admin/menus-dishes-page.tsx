import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Plus, 
  Trash2, 
  ChefHat, 
  Utensils, 
  RefreshCw,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/utils";

interface Menu {
  id: number;
  name: string;
  description?: string;
  price?: number;
}

interface Dish {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
}

export default function MenusDishesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
  const [showAddDishDialog, setShowAddDishDialog] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [selectedDishToAdd, setSelectedDishToAdd] = useState<number | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);

  // Buscar todos os menus
  const { data: menus = [], isLoading: menusLoading } = useQuery({
    queryKey: ["/api/menus"],
    queryFn: () => apiRequest("GET", "/api/menus").then(res => res.json()),
  });

  // Buscar todos os pratos disponíveis
  const { data: allDishes = [], isLoading: dishesLoading } = useQuery({
    queryKey: ["/api/dishes"],
    queryFn: () => apiRequest("GET", "/api/dishes").then(res => res.json()),
  });

  // Buscar pratos de um menu específico
  const { data: menuDishes = [], isLoading: menuDishesLoading, refetch: refetchMenuDishes } = useQuery({
    queryKey: ["/api/menus", selectedMenu?.id, "dishes"],
    queryFn: () => selectedMenu 
      ? apiRequest("GET", `/api/menus/${selectedMenu.id}/dishes`).then(res => res.json())
      : Promise.resolve([]),
    enabled: !!selectedMenu,
  });

  // Filtrar menus por busca
  const filteredMenus = menus.filter((menu: Menu) =>
    menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (menu.description && menu.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtrar pratos disponíveis para adicionar (excluindo os já no menu)
  const availableDishes = allDishes.filter((dish: Dish) => 
    !menuDishes.some((menuDish: Dish) => menuDish.id === dish.id)
  );

  // Mutação para adicionar prato ao menu
  const addDishToMenuMutation = useMutation({
    mutationFn: async ({ menuId, dishId }: { menuId: number; dishId: number }) => {
      return apiRequest("POST", `/api/menus/${menuId}/dishes/${dishId}`);
    },
    onSuccess: () => {
      toast({
        title: "Prato adicionado",
        description: "Prato vinculado ao menu com sucesso!",
      });
      refetchMenuDishes();
      setShowAddDishDialog(false);
      setSelectedDishToAdd(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao adicionar prato ao menu",
        variant: "destructive",
      });
    },
  });

  // Mutação para remover prato do menu
  const removeDishFromMenuMutation = useMutation({
    mutationFn: async ({ menuId, dishId }: { menuId: number; dishId: number }) => {
      return apiRequest("DELETE", `/api/menus/${menuId}/dishes/${dishId}`);
    },
    onSuccess: () => {
      toast({
        title: "Prato removido",
        description: "Prato removido do menu com sucesso!",
      });
      refetchMenuDishes();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao remover prato do menu",
        variant: "destructive",
      });
    },
  });

  // Mutação para migração
  const migrationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/admin/migrate-menu-dishes");
    },
    onSuccess: () => {
      toast({
        title: "Migração concluída",
        description: "Todos os pratos antigos foram migrados com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/menus"] });
      setIsMigrating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro na migração",
        description: error.message || "Erro ao executar migração",
        variant: "destructive",
      });
      setIsMigrating(false);
    },
  });

  const handleAddDishToMenu = () => {
    if (!selectedMenu || !selectedDishToAdd) return;
    
    addDishToMenuMutation.mutate({
      menuId: selectedMenu.id,
      dishId: selectedDishToAdd,
    });
  };

  const handleRemoveDishFromMenu = (dishId: number) => {
    if (!selectedMenu) return;
    
    removeDishFromMenuMutation.mutate({
      menuId: selectedMenu.id,
      dishId,
    });
  };

  const handleMigration = () => {
    setIsMigrating(true);
    migrationMutation.mutate();
  };

  const toggleMenuExpansion = (menuId: number) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const handleOpenAddDialog = (menu: Menu) => {
    setSelectedMenu(menu);
    setShowAddDishDialog(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menus & Pratos</h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os menus e seus pratos vinculados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleMigration}
            disabled={isMigrating}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isMigrating ? 'animate-spin' : ''}`} />
            {isMigrating ? 'Migrando...' : 'Migrar Pratos Antigos'}
          </Button>
        </div>
      </div>

      {/* Barra de busca */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar menus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Menus</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menusLoading ? <Skeleton className="h-8 w-16" /> : menus.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pratos</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dishesLoading ? <Skeleton className="h-8 w-16" /> : allDishes.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menus com Pratos</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {menusLoading ? <Skeleton className="h-8 w-16" /> : 
                menus.filter((menu: Menu) => expandedMenus.has(menu.id)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Menus */}
      {menusLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMenus.map((menu: Menu) => (
            <Card key={menu.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleMenuExpansion(menu.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {expandedMenus.has(menu.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                    <ChefHat className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold text-lg">{menu.name}</h3>
                      {menu.description && (
                        <p className="text-sm text-gray-600">{menu.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {expandedMenus.has(menu.id) ? "Expandido" : "Recolhido"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {expandedMenus.has(menu.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Header dos pratos */}
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">Pratos do Menu</h4>
                      <Button
                        size="sm"
                        onClick={() => handleOpenAddDialog(menu)}
                        disabled={availableDishes.length === 0}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar Prato
                      </Button>
                    </div>

                    {/* Lista de pratos */}
                    {selectedMenu?.id === menu.id && menuDishesLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center gap-4 p-3 border rounded">
                            <Skeleton className="h-12 w-12 rounded" />
                            <div className="flex-1">
                              <Skeleton className="h-4 w-32 mb-2" />
                              <Skeleton className="h-3 w-48" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                          </div>
                        ))}
                      </div>
                    ) : selectedMenu?.id === menu.id && menuDishes.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Prato</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Preço</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {menuDishes.map((dish: Dish) => (
                            <TableRow key={dish.id}>
                              <TableCell className="font-medium">{dish.name}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {dish.description || "Sem descrição"}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{dish.category || "Sem categoria"}</Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(dish.price)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDishFromMenu(dish.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhum prato vinculado a este menu</p>
                        <p className="text-sm">Clique em "Adicionar Prato" para começar</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para adicionar prato */}
      <Dialog open={showAddDishDialog} onOpenChange={setShowAddDishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Prato ao Menu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Selecionar Prato</label>
              <Select
                value={selectedDishToAdd?.toString() || ""}
                onValueChange={(value) => setSelectedDishToAdd(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um prato" />
                </SelectTrigger>
                <SelectContent>
                  {availableDishes.map((dish: Dish) => (
                    <SelectItem key={dish.id} value={dish.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{dish.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {formatCurrency(dish.price)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDishDialog(false);
                setSelectedDishToAdd(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddDishToMenu}
              disabled={!selectedDishToAdd || addDishToMenuMutation.isPending}
            >
              {addDishToMenuMutation.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 