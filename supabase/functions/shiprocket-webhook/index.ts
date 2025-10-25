import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShiprocketWebhookPayload {
  order_id: string;
  status: string;
  status_code: number;
  awb_code: string;
  courier_name: string;
  courier_company_id: number;
  tracking_data: {
    status: string;
    status_code: number;
    status_date: string;
    status_location: string;
  }[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify webhook signature if needed (Shiprocket provides webhook verification)
    const signature = req.headers.get('X-Shiprocket-Signature')
    const webhookSecret = Deno.env.get('SHIPROCKET_WEBHOOK_SECRET')
    
    // For now, we'll trust the webhook. In production, verify signature
    if (webhookSecret && signature) {
      // Implement signature verification here
      console.log('Webhook signature verification needed')
    }

    const payload: ShiprocketWebhookPayload = await req.json()

    if (!payload.order_id) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Find order by Shiprocket order ID
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('shiprocket_order_id', payload.order_id)
      .single()

    if (orderError || !order) {
      console.error('Order not found for Shiprocket order ID:', payload.order_id)
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Map Shiprocket status to our fulfillment status
    let fulfillmentStatus = order.fulfillment_status
    let updateFields: any = {}

    switch (payload.status_code) {
      case 1: // Pending
        fulfillmentStatus = 'processing'
        break
      case 2: // Confirmed
        fulfillmentStatus = 'processing'
        break
      case 3: // Picked Up
        fulfillmentStatus = 'shipped'
        updateFields.shipped_at = new Date().toISOString()
        break
      case 4: // In Transit
        fulfillmentStatus = 'shipped'
        break
      case 5: // Out for Delivery
        fulfillmentStatus = 'out_for_delivery'
        break
      case 6: // Delivered
        fulfillmentStatus = 'delivered'
        updateFields.delivered_at = new Date().toISOString()
        break
      case 7: // RTO
        fulfillmentStatus = 'returned'
        break
      case 8: // Cancelled
        fulfillmentStatus = 'cancelled'
        break
      default:
        console.log('Unknown status code:', payload.status_code)
    }

    // Update order with new status and tracking info
    updateFields.fulfillment_status = fulfillmentStatus
    updateFields.awb = payload.awb_code
    updateFields.courier = payload.courier_name
    updateFields.tracking_url = `https://www.shiprocket.in/tracking/${payload.awb_code}`

    const { error: updateError } = await supabaseClient
      .from('orders')
      .update(updateFields)
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update order' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Add tracking events to order_events table
    if (payload.tracking_data && payload.tracking_data.length > 0) {
      const events = payload.tracking_data.map(tracking => ({
        order_id: order.id,
        status: tracking.status,
        note: `${tracking.status} - ${tracking.status_location || ''}`,
        created_at: tracking.status_date
      }))

      const { error: eventsError } = await supabaseClient
        .from('order_events')
        .upsert(events, { 
          onConflict: 'order_id,status,created_at',
          ignoreDuplicates: true 
        })

      if (eventsError) {
        console.error('Error adding tracking events:', eventsError)
      }
    }

    console.log(`Updated order ${order.id} to status: ${fulfillmentStatus}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process webhook' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
