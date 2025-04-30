import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartItem } from "@/context/cart-context";
import { formatCurrency } from "@/lib/utils";

interface EditCartItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: CartItem;
  onSave: (updatedItem: CartItem) => void;
}

export function EditCartItemModal({ open, onOpenChange, item, onSave }: EditCartItemModalProps) {
  const [guestCount, setGuestCount] = useState(item.guestCount);
  const [quantity, setQuantity] = useState(item.quantity);
  const [date, setDate] = useState(item.date);
  const [time, setTime] = useState(item.time || "12:00");

  const WAITER_UNIT_PRICE = 260;
  const calculateWaiterFee = () => {
    if (!guestCount) return 0;
    const numWaiters = Math.ceil(guestCount / 10);
    return numWaiters * WAITER_UNIT_PRICE;
  };

  useEffect(() => {
    if (open) {
      setGuestCount(item.guestCount);
      setQuantity(item.quantity);
      setDate(item.date);
      setTime(item.time || "12:00");
    }
  }, [open, item]);

  const handleSave = () => {
    const updatedItem = {
      ...item,
      guestCount,
      quantity,
      date,
      time,
      waiterFee: calculateWaiterFee()
    };
    onSave(updatedItem);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Item do Carrinho</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="guestCount">Número de Convidados</Label>
            <Input
              id="guestCount"
              type="number"
              min="1"
              value={guestCount}
              onChange={(e) => setGuestCount(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Horário</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Adicional de garçons:</span>
              <span className="font-medium">{formatCurrency(calculateWaiterFee())}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 