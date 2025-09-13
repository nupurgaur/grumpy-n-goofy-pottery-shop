import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShoppingCart, Plus, Minus, Trash2, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const CartIcon = () => {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && (
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center">
              {itemCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-auto">
        <CartContent onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

const CartContent = ({ onClose }: { onClose: () => void }) => {
  const { items, totalPrice, loading, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading cart...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-brand-primary">Your cart is empty</h3>
          <p className="text-muted-foreground">Start shopping to add items to your cart</p>
        </div>
        <Button onClick={onClose} variant="outline">
          Continue Shopping
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4">
      <DialogHeader className="border-b pb-4">
        <DialogTitle className="flex items-center justify-between">
          <span>Shopping Cart ({items.length} items)</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={clearCart}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </DialogTitle>
      </DialogHeader>

      <div className="max-h-[40vh] overflow-auto py-4 space-y-4">
        {items.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            onUpdateQuantity={updateQuantity}
            onRemove={removeItem}
          />
        ))}
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="flex items-center justify-between text-lg font-semibold">
          <span>Total:</span>
          <span className="text-brand-primary">₹{totalPrice.toFixed(2)}</span>
        </div>
        
        <div className="space-y-2">
          <Button 
            className="w-full" 
            size="lg"
            onClick={() => {
              onClose();
              navigate('/checkout');
            }}
          >
            Proceed to Checkout
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemove 
}: { 
  item: any;
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemove: (id: number) => void;
}) => {
  return (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <img 
        src={item.product_image} 
        alt={item.product_name}
        className="w-16 h-16 object-cover rounded-md"
      />
      
      <div className="flex-1 space-y-1">
        <h4 className="font-medium text-sm">{item.product_name}</h4>
        <p className="text-sm text-muted-foreground">₹{item.product_price}</p>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive ml-2"
            onClick={() => onRemove(item.product_id)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="font-medium text-sm">₹{(item.product_price * item.quantity).toFixed(2)}</p>
      </div>
    </div>
  );
};

export default CartContent;