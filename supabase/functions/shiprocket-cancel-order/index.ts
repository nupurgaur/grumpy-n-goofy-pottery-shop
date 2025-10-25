import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShiprocketAuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
}

interface ShiprocketCancelResponse {
  status: string;
  message: string;
}

async function getShiprocketToken(): Promise<string> {
  const email = Deno.env.get('SHIPROCKET_EMAIL')
  const password = Deno.env.get('SHIPROCKET_PASSWORD')
  
  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured')
  }

  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    throw new Error(`Shiprocket auth failed: ${response.statusText}`)
  }

  const data: ShiprocketAuthResponse = await response.json()
  return data.token
}

async function cancelShiprocketOrder(token: string, orderId: string): Promise<ShiprocketCancelResponse> {
  // First, let's try to get the order details to verify it exists
  const orderDetailsResponse = await fetch(`https://apiv2.shiprocket.in/v1/external/orders/show/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (!orderDetailsResponse.ok) {
    const errorText = await orderDetailsResponse.text()
    throw new Error(`Shiprocket order not found: ${orderDetailsResponse.statusText} - ${errorText}`)
  }

  const orderDetails = await orderDetailsResponse.json()
  console.log('Order details:', orderDetails)

  // Check if order can be cancelled based on status
  if (orderDetails.status === 'shipped' || orderDetails.status === 'delivered') {
    throw new Error(`Order cannot be cancelled as it has status: ${orderDetails.status}`)
  }

  // Use the correct cancellation endpoint with proper request body format
  const response = await fetch(`https://apiv2.shiprocket.in/v1/external/orders/cancel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ids: [parseInt(orderId)] // Convert string to number and wrap in array
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Shiprocket order cancellation failed: ${response.statusText} - ${errorText}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Since RLS is disabled, ANON_KEY should work fine
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { order_id } = await req.json()

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get order details from database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', { orderError, order_id })
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found order:', {
      id: order.id,
      user_id: order.user_id,
      fulfillment_status: order.fulfillment_status,
      shiprocket_order_id: order.shiprocket_order_id
    })

    // Check if order has Shiprocket order ID
    if (!order.shiprocket_order_id) {
      return new Response(
        JSON.stringify({ error: 'Order does not have Shiprocket shipment' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if order can be cancelled (not shipped yet)
    if (order.fulfillment_status === 'shipped' || order.fulfillment_status === 'out_for_delivery' || order.fulfillment_status === 'delivered') {
      return new Response(
        JSON.stringify({ error: 'Order cannot be cancelled as it has already been shipped' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Attempting to cancel order:', {
      order_id: order_id,
      shiprocket_order_id: order.shiprocket_order_id,
      fulfillment_status: order.fulfillment_status
    })

    // Get Shiprocket token
    const token = await getShiprocketToken()

    // Cancel Shiprocket order
    const cancelResponse = await cancelShiprocketOrder(token, order.shiprocket_order_id)

    // Update order in database
    console.log('Updating order in database:', {
      order_id: order_id,
      shiprocket_order_id: order.shiprocket_order_id,
      current_status: order.fulfillment_status
    })

    // First, let's check if the order exists and get its current state
    const { data: existingOrder, error: fetchError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single()

    console.log('Existing order before update:', {
      found: !!existingOrder,
      error: fetchError,
      current_status: existingOrder?.fulfillment_status
    })

    const { data: updateData, error: updateError } = await supabaseClient
      .from('orders')
      .update({
        fulfillment_status: 'cancelled',
        shiprocket_order_id: null // Clear Shiprocket order ID
      })
      .eq('id', order_id)
      .select()

    console.log('Database update result:', {
      updateData,
      updateError,
      rowsAffected: updateData?.length || 0
    })

    // Check if any rows were actually updated
    if (!updateData || updateData.length === 0) {
      console.error('No rows were updated in the database!')
      return new Response(
        JSON.stringify({ 
          error: 'Order cancelled in Shiprocket but no rows were updated in database',
          details: 'This might be due to RLS policies or insufficient permissions'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (updateError) {
      console.error('Error updating order in database:', updateError)
      return new Response(
        JSON.stringify({ 
          error: 'Order cancelled in Shiprocket but failed to update database status',
          details: updateError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Order successfully cancelled and database updated:', {
      order_id: order_id,
      fulfillment_status: 'cancelled'
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: cancelResponse.message,
        status: cancelResponse.status
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error cancelling Shiprocket order:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to cancel Shiprocket order' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
