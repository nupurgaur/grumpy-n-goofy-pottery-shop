import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  user_id: string;
  product_id: number;
  product_name: string;
  product_price: number;
  product_image: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  loading: boolean;
  addItem: (product: {
    id: number;
    name: string;
    price: number;
    image: string;
  }, stockQuantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load cart items when user logs in
  useEffect(() => {
    if (user) {
      loadCartItems();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const loadCartItems = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading cart:', error);
      toast({
        title: "Error loading cart",
        description: "Failed to load your cart items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addItem = async (product: {
    id: number;
    name: string;
    price: number;
    image: string;
  }, stockQuantity?: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart",
        variant: "destructive"
      });
      return;
    }

    try {
      // Check stock availability if provided
      if (stockQuantity !== undefined && stockQuantity <= 0) {
        toast({
          title: "Out of stock",
          description: `${product.name} is currently out of stock`,
          variant: "destructive"
        });
        return;
      }

      // Check if item already exists
      const existingItem = items.find(item => item.product_id === product.id);
      
      if (existingItem) {
        // Check if we can add one more to existing quantity
        if (stockQuantity !== undefined && existingItem.quantity >= stockQuantity) {
          toast({
            title: "Insufficient stock",
            description: `Only ${stockQuantity} items available`,
            variant: "destructive"
          });
          return;
        }
        await updateQuantity(product.id, existingItem.quantity + 1);
        return;
      }

      // Add new item
      const { data, error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image,
          quantity: 1
        })
        .select()
        .single();

      if (error) throw error;

      setItems(prev => [...prev, data]);
      
      // Update stock when item is added to cart
      if (stockQuantity !== undefined) {
        await supabase.rpc('update_product_stock', {
          p_product_id: product.id,
          p_quantity_change: -1,
          p_movement_type: 'sale',
          p_notes: 'Added to cart'
        });
      }

      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error adding item",
        description: "Failed to add item to cart",
        variant: "destructive"
      });
    }
  };

  const updateQuantity = async (productId: number, quantity: number) => {
    if (!user || quantity < 1) return;

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .select()
        .single();

      if (error) throw error;

      setItems(prev => 
        prev.map(item => 
          item.product_id === productId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: "Error updating quantity",
        description: "Failed to update item quantity",
        variant: "destructive"
      });
    }
  };

  const removeItem = async (productId: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.product_id !== productId));
      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      });
    } catch (error) {
      console.error('Error removing item:', error);
      toast({
        title: "Error removing item",
        description: "Failed to remove item from cart",
        variant: "destructive"
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setItems([]);
      toast({
        title: "Cart cleared",
        description: "All items have been removed from your cart",
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast({
        title: "Error clearing cart",
        description: "Failed to clear your cart",
        variant: "destructive"
      });
    }
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalPrice = items.reduce((total, item) => total + (item.product_price * item.quantity), 0);

  const value = {
    items,
    itemCount,
    totalPrice,
    loading,
    addItem,
    updateQuantity,
    removeItem,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};