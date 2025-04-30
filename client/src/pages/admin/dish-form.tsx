import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dish } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Form schema
const dishFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.number().min(0, "Preço deve ser maior que 0"),
  image_url: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
});

type DishFormValues = z.infer<typeof dishFormSchema>;

const defaultValues: DishFormValues = {
  name: "",
  description: "",
  price: 0,
  image_url: "",
  category: "appetizer",
};

type DishFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  menuId: number;
  dish?: Dish;
  isEditing?: boolean;
};

export default function DishForm({
  open,
  onOpenChange,
  menuId,
  dish,
  isEditing = false,
}: DishFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form
  const form = useForm<DishFormValues>({
    resolver: zodResolver(dishFormSchema),
    defaultValues: dish
      ? {
          name: dish.name,
          description: dish.description,
          price: dish.price,
          image_url: dish.imageUrl || "",
          category: dish.category,
        }
      : defaultValues,
  });

  // Add dish mutation
  const addDishMutation = useMutation({
    mutationFn: async (dishData: DishFormValues) => {
      console.log("[Mutation] Sending add dish request:", dishData);
      const res = await apiRequest("POST", `/api/menus/${menuId}/dishes`, dishData);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("[Mutation] Add dish success. Response data:", data);
      onOpenChange(false);
      console.log("[Mutation] Invalidating dishes query...");
      queryClient.invalidateQueries({ queryKey: ["/api/menus", menuId, "dishes"] });
      console.log("[Mutation] Dishes query invalidated.");
      toast({
        title: "Prato adicionado",
        description: "O prato foi adicionado com sucesso.",
      });
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
    mutationFn: async (dishData: DishFormValues) => {
      if (!dish) throw new Error("Dish ID is missing");
      const res = await apiRequest("PUT", `/api/dishes/${dish.id}`, dishData);
      return await res.json();
    },
    onSuccess: () => {
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/menus", menuId, "dishes"] });
      toast({
        title: "Prato atualizado",
        description: "O prato foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar prato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = async (values: DishFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing && dish) {
        await updateDishMutation.mutateAsync(values);
      } else {
        await addDishMutation.mutateAsync(values);
      }
    } catch (error) {
      console.error("Error submitting dish:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Prato" : "Adicionar Prato"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do prato" {...field} />
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
                    <Textarea
                      placeholder="Descrição do prato"
                      className="resize-none"
                      {...field}
                    />
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
                      min="0"
                      placeholder="0.00"
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
                    <Input placeholder="URL da imagem" {...field} />
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
                      <SelectItem value="appetizer">Entrada</SelectItem>
                      <SelectItem value="main">Prato Principal</SelectItem>
                      <SelectItem value="dessert">Sobremesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : isEditing ? "Atualizar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 