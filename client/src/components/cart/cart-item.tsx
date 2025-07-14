import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { CartItem as CartItemType } from "@shared/schema";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { EditCartItemModal } from "./edit-cart-item-modal";

interface CartItemProps {
  item: CartItemType & {
    menuItems?: {
      entradas?: string[];
      pratosPrincipais?: string[];
      sobremesas?: string[];
    };
    time?: string;
  };
}

export default function CartItem({ item }: CartItemProps) {
  const { removeFromCart, updateCartItem } = useCart();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleUpdateItem = (updatedItem: CartItemType) => {
    updateCartItem(updatedItem);
  };

  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg bg-card border-card">
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-20 h-20 object-cover rounded-md"
      />
      
      <div className="flex-1">
        <h3 className="font-medium text-foreground">{item.title}</h3>
        <p className="text-sm text-muted-foreground">
          {item.menuSelection} • {item.guestCount} convidados
        </p>
        <p className="text-sm text-muted-foreground">
          {item.date} • {item.time || "12:00"}
        </p>
        
        {item.menuItems && (
          <div className="mt-2 text-sm text-muted-foreground">
            {item.menuItems.entradas && item.menuItems.entradas.length > 0 && (
              <p>Entradas: {item.menuItems.entradas.join(", ")}</p>
            )}
            {item.menuItems.pratosPrincipais && item.menuItems.pratosPrincipais.length > 0 && (
              <p>Pratos Principais: {item.menuItems.pratosPrincipais.join(", ")}</p>
            )}
            {item.menuItems.sobremesas && item.menuItems.sobremesas.length > 0 && (
              <p>Sobremesas: {item.menuItems.sobremesas.join(", ")}</p>
            )}
          </div>
        )}
        
        <div className="mt-2 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEditModal(true)}
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => removeFromCart(item.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Remover
          </Button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-medium text-foreground">
          {formatCurrency(item.price * item.quantity)}
        </p>
        <p className="text-sm text-muted-foreground">
          Adicional de garçons: {formatCurrency(item.waiterFee || 0)}
          <span className="text-xs text-muted-foreground block">
            (1 garçom a cada 10 convidados)
          </span>
        </p>
      </div>

      <EditCartItemModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        item={item}
        onSave={handleUpdateItem}
      />
    </div>
  );
}
