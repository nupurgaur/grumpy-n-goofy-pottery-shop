import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string;
  images: string[] | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_featured: boolean;
  is_active: boolean;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: string;
  product_id: number;
  movement_type: 'sale' | 'restock' | 'adjustment';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  created_at: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: "Error loading products",
        description: "Failed to load product catalog",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: number, quantityChange: number, movementType: 'sale' | 'restock' | 'adjustment', notes?: string) => {
    try {
      const { data, error } = await supabase.rpc('update_product_stock', {
        p_product_id: productId,
        p_quantity_change: quantityChange,
        p_movement_type: movementType,
        p_notes: notes
      });

      if (error) throw error;

      // Reload products to get updated stock
      await loadProducts();
      
      toast({
        title: "Stock updated",
        description: `Product stock ${quantityChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(quantityChange)}`,
      });

      return true;
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error updating stock",
        description: error.message || "Failed to update product stock",
        variant: "destructive"
      });
      return false;
    }
  };

  const checkStockAvailability = (product: Product, requestedQuantity: number): boolean => {
    return product.stock_quantity >= requestedQuantity;
  };

  const isLowStock = (product: Product): boolean => {
    return product.stock_quantity <= product.low_stock_threshold;
  };

  const getStockStatus = (product: Product): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (product.stock_quantity === 0) return 'out-of-stock';
    if (product.stock_quantity <= product.low_stock_threshold) return 'low-stock';
    return 'in-stock';
  };

  return {
    products,
    loading,
    updateStock,
    checkStockAvailability,
    isLowStock,
    getStockStatus,
    refreshProducts: loadProducts
  };
};