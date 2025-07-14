import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, PencilLine, Trash2, Filter, Link as LinkIcon, BookOpen, ListChecks, Tag, Pencil, Trash } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatCurrency } from "@/lib/utils";
import React from "react";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";
import { Textarea } from "@/components/ui/textarea";
import { API_URL } from '../../config';

// Form schema
const dishFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.number().min(0, "Preço deve ser maior que 0"),
  image_url: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
});

type DishFormValues = z.infer<typeof dishFormSchema>;

// Associate dish with menu schema
const associateDishSchema = z.object({
  menuId: z.number().min(1, "Cardápio é obrigatório"),
});

type AssociateDishValues = z.infer<typeof associateDishSchema>;

// Form schema para categorias
const categoryFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  nameEn: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export default function AdminDishesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAssociateDialog, setShowAssociateDialog] = useState(false);
  const [showLinkedMenusDialog, setShowLinkedMenusDialog] = useState(false);
  const [selectedDish, setSelectedDish] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [linkedMenus, setLinkedMenus] = useState<any[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  
  // Configurar atualizações em tempo real para pratos e menus
  const realtimeUpdates = useRealtimeUpdates({
    queryKeys: [
      "/api/dishes", 
      selectedDish ? `/api/dishes/${selectedDish.id}/menus` : "/api/menus"
    ],
    pollingInterval: 5000,
    // Somente ativar o polling intenso quando um modal estiver aberto
    enabled: showLinkedMenusDialog || showAssociateDialog
  });

  // Fetch all dishes in the system
  const { data: dishes = [], isLoading: dishesLoading } = useQuery({
    queryKey: ["/api/dishes"],
    queryFn: () => apiRequest("GET", "/api/dishes").then(res => res.json()).catch(error => {
      toast({
        title: "Erro ao carregar pratos",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }),
    // Recarregar dados automaticamente a cada 5 segundos para manter a UI atualizada
    refetchInterval: 5000, 
    // Não refetch enquanto a janela está fora de foco
    refetchIntervalInBackground: false
  });

  // Fetch categories
  const { data: categories = [], isLoading: isLoadingCategories, refetch: refetchCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/categories`);
      if (!response.ok) {
        throw new Error("Erro ao carregar categorias");
      }
      return response.json();
    },
  });

  // Extract unique dishes by name (to avoid showing duplicates)
  const uniqueDishes = React.useMemo(() => {
    const dishMap = new Map();
    dishes.forEach((dish: any) => {
      // If this dish name isn't in the map yet, or this instance has an ID and the existing one doesn't
      if (!dishMap.has(dish.name) || (dish.id && !dishMap.get(dish.name).id)) {
        dishMap.set(dish.name, dish);
      }
    });
    return Array.from(dishMap.values());
  }, [dishes]);

  // Get category display text
  const getCategoryDisplay = (category: string) => {
    const foundCategory = categories.find(c => c.name.toLowerCase() === category.toLowerCase());
    return foundCategory?.name || category;
  };

  // Extract unique categories from dishes
  const uniqueCategories = React.useMemo(() => {
    // Extrair categorias únicas dos pratos
    const categoriesSet = new Set(uniqueDishes?.map((dish: any) => dish.category?.toLowerCase()) || []);
    
    // Filtrar valores vazios e null/undefined
    const filteredCategories = Array.from(categoriesSet).filter(Boolean);
    
    // Normalizar as categorias (converter para minúsculas)
    return filteredCategories;
  }, [uniqueDishes]);

  // Fetch all menus for dropdown
  const { data: menus = [] } = useQuery({
    queryKey: ["/api/menus"],
    queryFn: () => apiRequest("GET", "/api/menus").then(res => res.json()),
  });

  // Forms
  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      image_url: "",
      category: categories[0]?.name || "",
    },
  });

  const associateForm = useForm<AssociateDishValues>({
    resolver: zodResolver(associateDishSchema),
    defaultValues: {
      menuId: 0,
    },
  });

  // Form para categorias
  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      nameEn: "",
    },
  });

  // Add dish mutation
  const addDishMutation = useMutation({
    mutationFn: async (dishData: DishFormValues) => {
      console.log("[Mutation] Sending add dish request:", dishData);
      const res = await apiRequest("POST", "/api/dishes", dishData);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("[Mutation] Add dish success. Response data:", data);
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({
        title: "Prato adicionado",
        description: "Prato foi adicionado com sucesso",
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error("[Mutation] Error adding dish:", error);
      toast({
        title: "Erro ao adicionar prato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update dish mutation
  const updateDishMutation = useMutation({
    mutationFn: async ({ id, dishData }: { id: number; dishData: DishFormValues }) => {
      const res = await apiRequest("PUT", `/api/dishes/${id}`, dishData);
      return await res.json();
    },
    onSuccess: () => {
      setShowAddDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({
        title: "Prato atualizado",
        description: "Prato foi atualizado com sucesso",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar prato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete dish mutation
  const deleteDishMutation = useMutation({
    mutationFn: async (dishId: number) => {
      await apiRequest("DELETE", `/api/dishes/${dishId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      toast({
        title: "Prato excluído",
        description: "Prato foi excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir prato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Associate dish with menu mutation
  const associateDishMutation = useMutation({
    mutationFn: async ({ dishId, menuId }: { dishId: number; menuId: number }) => {
      const res = await apiRequest("POST", `/api/menus/${menuId}/dishes/${dishId}`);
      return await res.json();
    },
    onSuccess: (data, variables) => {
      setShowAssociateDialog(false);
      
      // Invalidar o cache de pratos para forçar uma atualização
      queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
      
      // Invalidar especificamente o cache de menus para este prato
      queryClient.invalidateQueries({ 
        queryKey: [`/api/dishes/${variables.dishId}/menus`] 
      });
      
      // Forçar atualização dos dados em tempo real
      forceRefreshData();
      
      // Se o modal de menus vinculados estiver aberto para o mesmo prato,
      // atualizar a lista diretamente para feedback imediato
      if (selectedDish && selectedDish.id === variables.dishId && showLinkedMenusDialog) {
        handleShowLinkedMenus(selectedDish);
      }
      
      toast({
        title: "Prato associado",
        description: "Prato foi associado ao cardápio com sucesso",
      });
      associateForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao associar prato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Function to handle showing linked menus
  const handleShowLinkedMenus = async (dish: { id: number; name: string; menuId?: number; }) => {
    if (!dish || !dish.id) {
      toast({
        title: "Erro",
        description: "Não foi possível identificar o prato selecionado",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedDish(dish);
    console.log("[UI] Exibindo cardápios vinculados ao prato ID:", dish.id);
    
    try {
      // Usar uma chave de cache específica para esta consulta
      const cacheKey = `/api/dishes/${dish.id}/menus`;
      
      // Força a busca de dados frescos da API, ignorando o cache
      queryClient.removeQueries({ queryKey: [cacheKey] });
      
      // Consulta simples sem headers extras que causam problemas de CORS
      const response = await apiRequest("GET", `/api/dishes/${dish.id}/menus`).then(res => res.json());
      
      console.log(`[UI] Encontrados ${response?.length || 0} cardápios vinculados pela API:`, response);
      
      if (response && response.length > 0) {
        setLinkedMenus(response);
      } else {
        console.log(`[UI] Nenhum cardápio vinculado encontrado pela API, verificando menuId individual`);
        
        // Fallback para o menuId direto apenas se a API não retornar resultados
        if (dish.menuId) {
          try {
            const menuResponse = await apiRequest("GET", `${API_URL}/api/menus/${dish.menuId}`).then(res => res.json());
            
            if (menuResponse) {
              setLinkedMenus([menuResponse]);
            } else {
              setLinkedMenus([]);
            }
          } catch (error) {
            console.error(`[UI] Erro ao buscar menu ${dish.menuId}:`, error);
            setLinkedMenus([]);
          }
        } else {
          setLinkedMenus([]);
        }
      }
      
      setShowLinkedMenusDialog(true);
    } catch (error) {
      console.error("[UI] Erro em handleShowLinkedMenus:", error);
      toast({
        title: "Erro ao buscar cardápios vinculados",
        description: "Não foi possível obter os cardápios vinculados a este prato.",
        variant: "destructive",
      });
    }
  };

  // Efeito para atualizar automaticamente a visualização de menus vinculados quando aberta
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (showLinkedMenusDialog && selectedDish) {
      // Configurar um intervalo para atualizar os menus vinculados a cada 2 segundos
      interval = setInterval(() => {
        console.log("[UI] Atualizando menus vinculados automaticamente...");
        handleShowLinkedMenus(selectedDish);
      }, 2000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showLinkedMenusDialog, selectedDish]);

  // Função utilitária para forçar atualização de dados em tempo real
  const forceRefreshData = useCallback(() => {
    // Invalidar cache de pratos
    queryClient.invalidateQueries({ queryKey: ["/api/dishes"] });
    
    // Se tivermos um prato selecionado, atualizar seus menus vinculados
    if (selectedDish && selectedDish.id) {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/dishes/${selectedDish.id}/menus`] 
      });
      
      // Se o modal de menus vinculados estiver aberto, atualizar a lista
      if (showLinkedMenusDialog) {
        handleShowLinkedMenus(selectedDish);
      }
    }
    
    // Invalidar cache de menus
    queryClient.invalidateQueries({ queryKey: ["/api/menus"] });
  }, [selectedDish, showLinkedMenusDialog]);

  // Handle dish form submission
  const onSubmit = (values: DishFormValues) => {
    if (isEditing && selectedDish) {
      updateDishMutation.mutate({ id: selectedDish.id, dishData: values });
    } else {
      addDishMutation.mutate(values);
    }
  };

  // Handle associate form submission
  const onAssociateSubmit = (values: AssociateDishValues) => {
    if (selectedDish) {
      associateDishMutation.mutate({ dishId: selectedDish.id, menuId: values.menuId });
    }
  };

  // Handle edit dish
  const handleEditDish = (dish: any) => {
    setSelectedDish(dish);
    setIsEditing(true);
    
    form.reset({
      name: dish.name,
      description: dish.description,
      price: typeof dish.price === 'string' ? parseFloat(dish.price) : dish.price,
      image_url: dish.image_url || "",
      category: dish.category,
    });
    
    setShowAddDialog(true);
  };

  // Handle associate dish
  const handleAssociateDish = (dish: any) => {
    setSelectedDish(dish);
    setShowAssociateDialog(true);
  };

  // Filter dishes based on search and category
  const filteredDishes = uniqueDishes?.filter((dish: any) => {
    const matchesSearch = 
      dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? dish.category?.toLowerCase() === categoryFilter.toLowerCase() : true;
    return matchesSearch && matchesCategory;
  });

  // Add category mutation
  const addCategoryMutation = useMutation({
    mutationFn: async (data: { name: string; nameEn?: string }) => {
      console.log("Enviando dados para adicionar categoria:", data);
      const response = await fetch(`${API_URL}/api/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao adicionar categoria");
      }

      const result = await response.json();
      console.log("Resposta da adição de categoria:", result);
      return result;
    },
    onSuccess: async (data) => {
      console.log("Categoria adicionada com sucesso:", data);
      toast.success("Categoria adicionada com sucesso");
      categoryForm.reset();
      setSelectedCategory(null);
      setIsEditingCategory(false);
      await refetchCategories();
    },
    onError: (error) => {
      console.error("Erro ao adicionar categoria:", error);
      toast.error(error.message || "Erro ao adicionar categoria");
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, categoryData }: { id: string; categoryData: CategoryFormValues }) => {
      console.log("[Mutation] Sending update category request:", { id, categoryData });
      const res = await apiRequest("PUT", `${API_URL}/api/categories/${id}`, categoryData);
      return await res.json();
    },
    onSuccess: () => {
      console.log("[Mutation] Update category success");
      setShowCategoryDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria atualizada",
        description: "Categoria foi atualizada com sucesso",
      });
      categoryForm.reset();
    },
    onError: (error: Error) => {
      console.error("[Mutation] Error updating category:", error);
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      await apiRequest("DELETE", `${API_URL}/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoria excluída",
        description: "Categoria foi excluída com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle edit category
  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setIsEditingCategory(true);
    categoryForm.reset({
      name: category.name,
      nameEn: category.nameEn || "",
    });
  };

  // Handle category form submission
  const onSubmitCategory = async (data: CategoryFormValues) => {
    try {
      console.log("Iniciando submissão de categoria:", data);
      if (selectedCategory) {
        await updateCategoryMutation.mutateAsync({
          id: selectedCategory.id.toString(),
          ...data,
        });
      } else {
        await addCategoryMutation.mutateAsync(data);
      }
    } catch (error) {
      console.error("Erro na submissão:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao salvar categoria");
    }
  };

  // Handle delete category
  const handleDeleteCategory = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await deleteCategoryMutation.mutateAsync(id);
      } catch (error) {
        console.error("Erro ao excluir categoria:", error);
        toast.error(error instanceof Error ? error.message : "Erro ao excluir categoria");
      }
    }
  };

  // Handle new category
  const handleNewCategory = () => {
    setSelectedCategory(null);
    setIsEditingCategory(true);
    categoryForm.reset();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-card-foreground">Gerenciar Pratos</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              setSelectedCategory(null);
              setIsEditingCategory(false);
              categoryForm.reset();
              setShowCategoryDialog(true);
            }}
            variant="outline"
            className="gap-2"
          >
            <Tag size={16} />
            Gerenciar Categorias
          </Button>
        <Button 
          onClick={() => {
            setIsEditing(false);
            setSelectedDish(null);
            form.reset();
            setShowAddDialog(true);
          }}
          className="gap-2"
        >
          <PencilLine size={16} />
          Criar Novo Prato
        </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  type="text"
                  placeholder="Buscar pratos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full md:w-64 pl-10"
                />
              </div>
              
              <Select
                value={categoryFilter || "all"}
                onValueChange={(value: string) => setCategoryFilter(value === "all" ? null : value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {uniqueCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {getCategoryDisplay(category)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dishes Table */}
      <Card>
        <CardContent className="p-0">
          {dishesLoading ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full mb-4" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : filteredDishes && filteredDishes.length > 0 ? (
            <div className="max-h-[500px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="bg-muted text-muted-foreground">Nome do Prato</TableHead>
                    <TableHead className="bg-muted text-muted-foreground">Categoria</TableHead>
                    <TableHead className="bg-muted text-muted-foreground">Cardápios</TableHead>
                    <TableHead className="bg-muted text-muted-foreground text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDishes.map((dish: any) => (
                    <TableRow key={dish.id} className="hover:bg-muted transition-colors">
                      <TableCell className="font-medium">{dish.name}</TableCell>
                      <TableCell>{getCategoryDisplay(dish.category)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleShowLinkedMenus(dish)}
                        >
                          <BookOpen className="h-4 w-4 mr-1" />
                          Ver Cardápios
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleAssociateDish(dish)}
                          >
                            <LinkIcon className="h-4 w-4 mr-1" />
                            Vincular
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditDish(dish)}
                          >
                            <PencilLine className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              if (window.confirm('Tem certeza que deseja excluir este prato?')) {
                                deleteDishMutation.mutate(dish.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum prato encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dish Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Prato" : "Novo Prato"}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nome do Prato</FormLabel>
                      <FormControl>
                      <Input placeholder="Digite o nome do prato" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                name="description"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>Descrição</FormLabel>
                        <FormControl>
                      <Textarea placeholder="Digite a descrição do prato" {...field} />
                        </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Digite o preço"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                  control={form.control}
                name="image_url"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                      <FormControl>
                      <Input placeholder="Digite a URL da imagem" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                name="category"
                  render={({ field }) => (
                    <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">
                  {isEditing ? "Salvar" : "Adicionar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Associate Dish Dialog */}
      <Dialog open={showAssociateDialog} onOpenChange={setShowAssociateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Prato a um Cardápio</DialogTitle>
          </DialogHeader>
          <Form {...associateForm}>
            <form onSubmit={associateForm.handleSubmit(onAssociateSubmit)} className="space-y-6">
              {selectedDish && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium text-card-foreground">Prato selecionado:</p>
                  <p className="text-base font-semibold text-card-foreground">{selectedDish.name}</p>
                </div>
              )}
              
              <FormField
                control={associateForm.control}
                name="menuId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cardápio</FormLabel>
                    <Select
                      onValueChange={(value: string) => field.onChange(Number(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cardápio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {menus?.map((menu: any) => (
                          <SelectItem key={menu.id} value={menu.id.toString()}>
                            {menu.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" type="button">Cancelar</Button>
                </DialogClose>
                <Button 
                  type="submit"
                  disabled={associateDishMutation.isPending}
                >
                  Vincular Prato
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Linked Menus Dialog */}
      <Dialog open={showLinkedMenusDialog} onOpenChange={(open) => {
        setShowLinkedMenusDialog(open);
        // Quando o modal é aberto, forçar uma atualização imediata
        if (open && selectedDish) {
          // Forçar atualização imediata dos dados
          realtimeUpdates.forceRefresh();
          // Buscar os dados mais recentes
          handleShowLinkedMenus(selectedDish);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Cardápios Vinculados
              {realtimeUpdates.lastRefresh && (
                <span className="text-xs text-gray-400 font-normal ml-2">
                  Atualizado há {Math.floor((new Date().getTime() - realtimeUpdates.lastRefresh.getTime()) / 1000)} segundos
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedDish && (
            <div className="bg-muted p-3 rounded-md mb-4">
              <p className="text-sm font-medium text-card-foreground">Prato selecionado:</p>
              <p className="text-base font-semibold text-card-foreground">{selectedDish.name}</p>
            </div>
          )}
          
          {linkedMenus.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Este prato está vinculado aos seguintes cardápios:</p>
              <div className="max-h-[300px] overflow-auto space-y-2 pr-2">
                {linkedMenus.map((menu: any) => (
                  <div key={menu.id} className="p-3 border rounded-md flex justify-between items-center bg-muted">
                    <div>
                      <p className="font-medium text-card-foreground">{menu.name}</p>
                      <p className="text-sm text-muted-foreground">{formatCurrency(menu.price)} por pessoa</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        window.location.href = `/admin/menus/${menu.id}/dishes`;
                      }}
                    >
                      Ver Cardápio
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">Este prato não está vinculado a nenhum cardápio.</p>
              <Button 
                onClick={() => {
                  setShowLinkedMenusDialog(false);
                  setTimeout(() => {
                    handleAssociateDish(selectedDish);
                  }, 100);
                }}
              >
                Vincular a um Cardápio
              </Button>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar Categorias</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Categorias</h3>
              <Button onClick={handleNewCategory}>
                Nova Categoria
              </Button>
            </div>
            
            {!isEditingCategory && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {isLoadingCategories ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : categories.length > 0 ? (
                  categories.map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.nameEn && (
                          <p className="text-sm text-muted-foreground">{category.nameEn}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCategory(category.id.toString())}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhuma categoria cadastrada
                  </p>
                )}
              </div>
            )}

            {isEditingCategory && (
              <Form {...categoryForm}>
                <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4">
                  <FormField
                    control={categoryForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Categoria</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={categoryForm.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome em Inglês (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        categoryForm.reset();
                        setSelectedCategory(null);
                        setIsEditingCategory(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={addCategoryMutation.isPending || updateCategoryMutation.isPending}
                    >
                      {addCategoryMutation.isPending || updateCategoryMutation.isPending
                        ? "Salvando..."
                        : selectedCategory
                        ? "Salvar"
                        : "Adicionar"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
} 