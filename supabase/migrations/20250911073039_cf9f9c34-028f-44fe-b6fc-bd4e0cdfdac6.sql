-- Fix the function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;