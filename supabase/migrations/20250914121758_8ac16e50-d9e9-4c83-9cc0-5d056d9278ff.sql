-- Add category column to products table
ALTER TABLE public.products 
ADD COLUMN category TEXT DEFAULT 'general';

-- Update the category column to be NOT NULL with a default
ALTER TABLE public.products 
ALTER COLUMN category SET NOT NULL;

-- Add an index for better performance when filtering by category
CREATE INDEX idx_products_category ON public.products(category);

-- Add some predefined categories as constraints (optional - for data consistency)
ALTER TABLE public.products 
ADD CONSTRAINT check_valid_category 
CHECK (category IN ('mugs', 'bowls', 'plates', 'ceramic-clocks', 'lamps', 'spoon-rests', 'vases', 'general'));