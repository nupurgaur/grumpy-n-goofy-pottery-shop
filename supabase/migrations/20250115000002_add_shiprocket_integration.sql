-- Add Shiprocket integration fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_snapshot JSONB; -- Denormalized shipping address at time of order

-- Add product dimensions and weight fields
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS length_cm INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS width_cm INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS height_cm INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS hsn TEXT; -- HSN code for invoice

-- Create order events table for tracking status changes
CREATE TABLE IF NOT EXISTS order_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create return requests table
CREATE TABLE IF NOT EXISTS return_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'return_shipped', 'returned', 'refunded')),
  description TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  return_shipment_id TEXT,
  return_awb TEXT,
  return_label_url TEXT,
  pickup_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment_status ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id ON orders(shiprocket_order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_order_id ON return_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_return_requests_status ON return_requests(status);

-- Create function to update order events when order status changes
CREATE OR REPLACE FUNCTION update_order_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert event for fulfillment status change
  IF OLD.fulfillment_status IS DISTINCT FROM NEW.fulfillment_status THEN
    INSERT INTO order_events (order_id, status, note)
    VALUES (NEW.id, NEW.fulfillment_status, 
      CASE 
        WHEN NEW.fulfillment_status = 'shipped' THEN 'Order shipped via ' || COALESCE(NEW.courier, 'courier')
        WHEN NEW.fulfillment_status = 'delivered' THEN 'Order delivered successfully'
        WHEN NEW.fulfillment_status = 'cancelled' THEN 'Order cancelled'
        WHEN NEW.fulfillment_status = 'returned' THEN 'Order returned'
        ELSE 'Status updated to ' || NEW.fulfillment_status
      END
    );
  END IF;

  -- Insert event for payment status change
  IF OLD.payment_status IS DISTINCT FROM NEW.payment_status THEN
    INSERT INTO order_events (order_id, status, note)
    VALUES (NEW.id, 'payment_' || NEW.payment_status, 'Payment status updated to ' || NEW.payment_status);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order events
DROP TRIGGER IF EXISTS trigger_update_order_event ON orders;
CREATE TRIGGER trigger_update_order_event
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_order_event();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS trigger_update_order_events_updated_at ON order_events;
CREATE TRIGGER trigger_update_order_events_updated_at
  BEFORE UPDATE ON order_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_return_requests_updated_at ON return_requests;
CREATE TRIGGER trigger_update_return_requests_updated_at
  BEFORE UPDATE ON return_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for new tables
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_requests ENABLE ROW LEVEL SECURITY;

-- Policy for order_events - users can only see their own order events
CREATE POLICY "Users can view their own order events" ON order_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_events.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Policy for return_requests - users can only see their own return requests
CREATE POLICY "Users can view their own return requests" ON return_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = return_requests.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create return requests for their orders" ON return_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = return_requests.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admin policies
CREATE POLICY "Admins can manage all order events" ON order_events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all return requests" ON return_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role = 'admin'
    )
  );
