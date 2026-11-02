-- Allow digital order fulfillment statuses (template PDFs, workshop bookings)
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_fulfillment_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_fulfillment_status_check
  CHECK (fulfillment_status IN (
    'pending',
    'processing',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'returned',
    'template_delivered',
    'workshop_confirmed'
  ));

-- Backfill paid template orders stuck in pending after payment
UPDATE public.orders
SET fulfillment_status = 'template_delivered'
WHERE payment_status = 'paid'
  AND fulfillment_status = 'pending'
  AND (
    notes ILIKE '%Template download%'
    OR shipping_address ILIKE '%Digital template%'
  );

-- Backfill paid workshop orders stuck in pending after payment
UPDATE public.orders
SET fulfillment_status = 'workshop_confirmed'
WHERE payment_status = 'paid'
  AND fulfillment_status = 'pending'
  AND (
    notes ILIKE '%Workshop booking%'
    OR shipping_address ILIKE '%Workshop booking%'
  );
