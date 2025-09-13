-- Update sample product prices to INR (Indian Rupees)
-- Converting from USD to INR with approximate exchange rate

UPDATE public.products 
SET 
  price = CASE 
    WHEN name = 'Grumpy Morning Mug' THEN 2100.00  -- ~$28 USD
    WHEN name = 'Goofy Garden Vase' THEN 3400.00    -- ~$45 USD  
    WHEN name = 'Happy Meal Bowl' THEN 2400.00      -- ~$32 USD
    ELSE price
  END,
  original_price = CASE 
    WHEN name = 'Grumpy Morning Mug' THEN 2600.00   -- ~$35 USD
    ELSE original_price
  END
WHERE name IN ('Grumpy Morning Mug', 'Goofy Garden Vase', 'Happy Meal Bowl');
