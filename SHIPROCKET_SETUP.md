# Shiprocket Integration Setup Guide

This guide will help you set up the Shiprocket integration for your pottery shop.

## Prerequisites

1. **Shiprocket Account**: You need an active Shiprocket account with API access
2. **Supabase Project**: Your Supabase project should be set up with the migrations applied
3. **Environment Variables**: Configure the required environment variables

## Environment Variables Setup

Add these environment variables to your Supabase project:

### Supabase Secrets (for Edge Functions)
```bash
# Shiprocket API Credentials
SHIPROCKET_EMAIL=grumpyngoofy@gmail.com
SHIPROCKET_PASSWORD=Rupun#1234

# Optional: Webhook secret for verification
SHIPROCKET_WEBHOOK_SECRET=your-webhook-secret
```

### Shiprocket Configuration
1. Log in to your Shiprocket dashboard
2. Go to Settings > API Settings
3. Note down your API credentials
4. Configure your pickup address:
   - Name: Your warehouse/store name
   - Phone: Contact number
   - Email: Contact email
   - Address: Complete warehouse address
   - City, State, Pincode: Location details

## Database Setup

Run the migration to add Shiprocket fields:

```sql
-- This migration is already created in supabase/migrations/20250115000002_add_shiprocket_integration.sql
-- Apply it using: supabase db push
```

## Product Configuration

Update your products with shipping dimensions and HSN codes:

```sql
-- Example: Update products with weight and dimensions
UPDATE products SET 
  weight_grams = 500,  -- Weight in grams
  length_cm = 15,      -- Length in cm
  width_cm = 12,       -- Width in cm
  height_cm = 10,       -- Height in cm
  hsn = '6911'         -- HSN code for pottery
WHERE id = 1;
```

## Testing the Integration

### 1. Test Order Creation
1. Add products to cart
2. Go through checkout process
3. Complete payment with Razorpay
4. Check that order is created with `fulfillment_status = 'pending'`
5. Verify Shiprocket shipment is created automatically

### 2. Test Admin Functions
1. Go to Admin Dashboard > Order Management
2. Switch to "Order Queue" tab
3. Verify orders appear with correct status
4. Test "Create Shipment" button for orders without Shiprocket ID
5. Check that AWB and tracking URLs are generated

### 3. Test User Order Management
1. Sign in as a user
2. Go to Orders page (`/orders`)
3. Verify order list shows with correct status
4. Click on order details
5. Test "Cancel Order" button (if order is cancellable)
6. Test "Request Return" button (if order is delivered)

### 4. Test Return Flow
1. Create a return request as a user
2. Go to Admin Dashboard > Order Management > Returns tab
3. Approve/reject return requests
4. Test creating return shipments

## Webhook Setup (Optional)

To receive real-time tracking updates:

1. In Shiprocket dashboard, go to Settings > Webhooks
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/shiprocket-webhook`
3. Select events: Order Status Updates, Tracking Updates
4. Set webhook secret in Supabase secrets

## Troubleshooting

### Common Issues

1. **Shiprocket Authentication Failed**
   - Verify email/password are correct
   - Check if account is active
   - Ensure API access is enabled

2. **Order Creation Fails**
   - Check pickup address is configured
   - Verify product dimensions are set
   - Ensure HSN codes are valid

3. **Webhook Not Working**
   - Verify webhook URL is accessible
   - Check webhook secret matches
   - Ensure CORS headers are set

### Debug Steps

1. Check Supabase Edge Function logs:
   ```bash
   supabase functions logs shiprocket-create-order
   ```

2. Verify database schema:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'orders' 
   AND column_name LIKE '%shiprocket%';
   ```

3. Test API endpoints manually:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/shiprocket-create-order \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"order_id": "your-order-id"}'
   ```

## Production Checklist

Before going live:

- [ ] Shiprocket account is production-ready
- [ ] Pickup address is correctly configured
- [ ] All products have dimensions and HSN codes
- [ ] Webhook is set up and tested
- [ ] Error handling is working
- [ ] Admin can manage orders and returns
- [ ] Users can track orders and request returns
- [ ] Test with real orders and shipments

## Support

For issues with:
- **Shiprocket API**: Contact Shiprocket support
- **Integration Code**: Check the Edge Function logs and database
- **Database Issues**: Verify migrations are applied correctly

## Features Implemented

✅ **Order Processing**
- Automatic Shiprocket shipment creation after payment
- Order status tracking (pending → processing → shipped → delivered)
- Order cancellation (until pickup assigned)

✅ **User Features**
- Order history page (`/orders`)
- Order details with tracking
- Return request functionality
- Order cancellation

✅ **Admin Features**
- Order queue management
- Shipment creation and tracking
- Return request approval/rejection
- Return shipment creation
- Manual status updates

✅ **Integration Features**
- Shiprocket API integration
- Webhook support for tracking updates
- Automatic AWB generation
- Label and invoice URLs
- Courier information

The integration is now ready for testing and production use!
