import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Menu, InsertMenu, insertMenuSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter"; // Import Link for navigation
import { z } from "zod";

type MenuFormValues = z.infer<typeof insertMenuSchema>;

export default function MenusCrudPage() {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch Menus
  const { data: menus, isLoading } = useQuery<Menu[]>({
    queryKey: ["/api/menus"],
    // Add error handling if needed
  });

  // Add Menu Mutation
  const addMenuMutation = useMutation({
    mutationFn: async (menuData: MenuFormValues) => {
      return apiRequest("POST", "/api/menus", menuData).then(res => res.json());
    },
    onSuccess: () => {
      setShowDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/menus"] });
      toast({ title: "Menu Adicionado", description: "Novo menu criado com sucesso." });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  // Update Menu Mutation
  const updateMenuMutation = useMutation({
    mutationFn: async ({ id, menuData }: { id: number; menuData: MenuFormValues }) => {
      return apiRequest("PUT", `/api/menus/${id}`, menuData).then(res => res.json());
    },
    onSuccess: () => {
      setShowDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/menus"] });
      toast({ title: "Menu Atualizado", description: "Menu atualizado com sucesso." });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  // Delete Menu Mutation
  const deleteMenuMutation = useMutation({
    mutationFn: async (menuId: number) => {
      return apiRequest("DELETE", `/api/menus/${menuId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/menus"] });
      toast({ title: "Menu Excluído", description: "Menu excluído com sucesso." });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  // Form setup
  const form = useForm<any>({
    resolver: zodResolver(insertMenuSchema) as any,
    defaultValues: { 
      name: "", 
      description: "",
      price: 0 
    },
  });

  const handleOpenDialog = (menu: Menu | null = null) => {
    if (menu) {
      setSelectedMenu(menu);
      setIsEditing(true);
      form.reset({ 
        name: menu.name, 
        description: menu.description || "",
        price: menu.price 
      });
    } else {
      setSelectedMenu(null);
      setIsEditing(false);
      form.reset({ 
        name: "", 
        description: "",
        price: 0 
      });
    }
    setShowDialog(true);
  };

  const onSubmit = (values: MenuFormValues) => {
    if (isEditing && selectedMenu) {
      updateMenuMutation.mutate({ id: selectedMenu.id, menuData: values });
    } else {
      addMenuMutation.mutate(values);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Menus (Cardápios)</h1>
        <Button onClick={() => handleOpenDialog()} className="gap-2">
          <PlusCircle size={16} />
          Novo Menu
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : menus && menus.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Preço por Pessoa</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menus.map((menu) => (
                  <TableRow key={menu.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{menu.name}</TableCell>
                    <TableCell>{menu.description}</TableCell>
                    <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(menu.price))}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                         {/* Link/Button to manage dishes for this menu - TO DO */}
                        <Link href={`/admin/menus/${menu.id}/dishes`}> 
                          <Button variant="outline" size="sm">Gerenciar Pratos</Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(menu)}>
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          if (window.confirm("Tem certeza que deseja excluir este menu? Isso NÃO excluirá os pratos associados.")) {
                            deleteMenuMutation.mutate(menu.id);
                          }
                        }}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum menu encontrado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Menu Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Menu" : "Novo Menu"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Atualize os detalhes do menu." : "Preencha os detalhes para criar um novo menu."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Menu</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Menu Casamento Clássico" {...field} />
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
                      <Textarea placeholder="Descreva o menu..." {...field} />
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
                    <FormLabel>Preço por Pessoa</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                <Button type="submit">{isEditing ? "Salvar Alterações" : "Criar Menu"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </main>
  );
} 