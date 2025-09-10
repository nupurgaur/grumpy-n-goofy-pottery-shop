-- Create products table with inventory management
CREATE TABLE public.products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  image_url TEXT NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read, admin write)
CREATE POLICY "Products are viewable by everyone" 
  ON public.products 
  FOR SELECT 
  USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample products with inventory
INSERT INTO public.products (name, description, price, original_price, image_url, stock_quantity, low_stock_threshold, is_featured, rating, review_count) VALUES
  ('Grumpy Morning Mug', 'Perfect for those who need coffee before conversation', 28.00, 35.00, '/src/assets/pottery-mug.jpg', 25, 5, true, 4.8, 124),
  ('Goofy Garden Vase', 'Brings joy to any space with its playful curves', 45.00, null, '/src/assets/pottery-vase.jpg', 15, 3, false, 4.9, 89),
  ('Happy Meal Bowl', 'Makes every meal feel like a celebration', 32.00, null, '/src/assets/pottery-bowl.jpg', 30, 8, false, 4.7, 156);

-- Create inventory tracking table for stock movements
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment')),
  quantity_change INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on inventory movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Create policy for inventory movements (read-only for public)
CREATE POLICY "Inventory movements are viewable by everyone" 
  ON public.inventory_movements 
  FOR SELECT 
  USING (true);

-- Create function to update stock and log movement
CREATE OR REPLACE FUNCTION public.update_product_stock(
  p_product_id INTEGER,
  p_quantity_change INTEGER,
  p_movement_type TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock INTEGER;
  new_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock_quantity INTO current_stock
  FROM public.products
  WHERE id = p_product_id;
  
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  
  -- Calculate new stock
  new_stock := current_stock + p_quantity_change;
  
  -- Prevent negative stock
  IF new_stock < 0 THEN
    RAISE EXCEPTION 'Insufficient stock. Current: %, Requested: %', current_stock, ABS(p_quantity_change);
  END IF;
  
  -- Update product stock
  UPDATE public.products
  SET stock_quantity = new_stock,
      updated_at = now()
  WHERE id = p_product_id;
  
  -- Log the movement
  INSERT INTO public.inventory_movements 
    (product_id, movement_type, quantity_change, previous_stock, new_stock, notes)
  VALUES 
    (p_product_id, p_movement_type, p_quantity_change, current_stock, new_stock, p_notes);
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;