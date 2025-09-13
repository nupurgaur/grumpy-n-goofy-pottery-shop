import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/hooks/useProducts';

export interface WishlistItem {
  id: string;
  product_id: number;
  user_id: string;
  created_at: string;
  product?: Product;
}

interface WishlistContextType {
  wishlist: WishlistItem[];
  loading: boolean;
  addToWishlist: (productId: number) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<boolean>;
  isInWishlist: (productId: number) => boolean;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlist([]);
    }
  }, [user]);

  const loadWishlist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlist(data || []);
    } catch (error: any) {
      console.error('Error loading wishlist:', error);
      toast({
        title: "Error loading wishlist",
        description: "Failed to load your wishlist",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId: number): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive"
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert([{
          user_id: user.id,
          product_id: productId
        }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Already in wishlist",
            description: "This item is already in your wishlist",
            variant: "default"
          });
          return false;
        }
        throw error;
      }

      // Reload wishlist to get the new item with product data
      await loadWishlist();
      
      toast({
        title: "Added to wishlist",
        description: "Item has been added to your wishlist",
      });

      return true;
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      toast({
        title: "Error adding to wishlist",
        description: error.message || "Failed to add item to wishlist",
        variant: "destructive"
      });
      return false;
    }
  };

  const removeFromWishlist = async (productId: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      // Update local state
      setWishlist(prev => prev.filter(item => item.product_id !== productId));
      
      toast({
        title: "Removed from wishlist",
        description: "Item has been removed from your wishlist",
      });

      return true;
    } catch (error: any) {
      console.error('Error removing from wishlist:', error);
      toast({
        title: "Error removing from wishlist",
        description: error.message || "Failed to remove item from wishlist",
        variant: "destructive"
      });
      return false;
    }
  };

  const isInWishlist = (productId: number): boolean => {
    return wishlist.some(item => item.product_id === productId);
  };

  const clearWishlist = async (): Promise<void> => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setWishlist([]);
      
      toast({
        title: "Wishlist cleared",
        description: "All items have been removed from your wishlist",
      });
    } catch (error: any) {
      console.error('Error clearing wishlist:', error);
      toast({
        title: "Error clearing wishlist",
        description: error.message || "Failed to clear wishlist",
        variant: "destructive"
      });
    }
  };

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    clearWishlist
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
