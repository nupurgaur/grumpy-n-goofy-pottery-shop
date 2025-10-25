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

interface ShiprocketReturnRequest {
  order_id: string;
  channel_id: string;
  pickup_customer_name: string;
  pickup_customer_phone: string;
  pickup_customer_email: string;
  pickup_address: string;
  pickup_city: string;
  pickup_state: string;
  pickup_pincode: string;
  pickup_country: string;
  return_reason: string;
  return_type: string;
  return_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
  }>;
}

interface ShiprocketReturnResponse {
  return_id: number;
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

async function createShiprocketReturn(token: string, returnData: ShiprocketReturnRequest): Promise<ShiprocketReturnResponse> {
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/return', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(returnData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Shiprocket return creation failed: ${response.statusText} - ${errorText}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { return_request_id } = await req.json()

    if (!return_request_id) {
      return new Response(
        JSON.stringify({ error: 'Return request ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get return request details from database
    const { data: returnRequest, error: returnError } = await supabaseClient
      .from('return_requests')
      .select(`
        *,
        orders (
          *,
          order_items (
            *,
            products (
              name,
              weight_grams,
              length_cm,
              width_cm,
              height_cm,
              hsn
            )
          )
        )
      `)
      .eq('id', return_request_id)
      .single()

    if (returnError || !returnRequest) {
      return new Response(
        JSON.stringify({ error: 'Return request not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const order = returnRequest.orders

    // Check if return request is approved
    if (returnRequest.status !== 'approved') {
      return new Response(
        JSON.stringify({ error: 'Return request must be approved before creating shipment' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if order has Shiprocket order ID
    if (!order.shiprocket_order_id) {
      return new Response(
        JSON.stringify({ error: 'Original order does not have Shiprocket shipment' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse pickup address
    let pickupAddress
    try {
      pickupAddress = typeof returnRequest.pickup_address === 'string' 
        ? JSON.parse(returnRequest.pickup_address) 
        : returnRequest.pickup_address
    } catch {
      pickupAddress = {
        address: returnRequest.pickup_address || '',
        city: '',
        state: '',
        pincode: '',
        phone: order.customer_phone || ''
      }
    }

    // Get Shiprocket token
    const token = await getShiprocketToken()

    // Prepare Shiprocket return data
    const shiprocketReturnData: ShiprocketReturnRequest = {
      order_id: order.shiprocket_order_id,
      channel_id: "1", // Default channel
      pickup_customer_name: order.customer_name,
      pickup_customer_phone: pickupAddress.phone || order.customer_phone || "",
      pickup_customer_email: order.customer_email,
      pickup_address: pickupAddress.address || "",
      pickup_city: pickupAddress.city || "",
      pickup_state: pickupAddress.state || "",
      pickup_pincode: pickupAddress.pincode || "",
      pickup_country: "India",
      return_reason: returnRequest.reason,
      return_type: "exchange", // or "refund" based on your policy
      return_items: order.order_items.map((item: any) => ({
        name: item.product_name,
        sku: `SKU-${item.product_id}`,
        units: item.quantity,
        selling_price: item.product_price
      }))
    }

    // Create Shiprocket return
    const shiprocketResponse = await createShiprocketReturn(token, shiprocketReturnData)

    // Update return request in database
    const { error: updateError } = await supabaseClient
      .from('return_requests')
      .update({
        status: 'return_shipped',
        return_shipment_id: shiprocketResponse.return_id.toString(),
        return_awb: shiprocketResponse.return_id.toString(), // Shiprocket might provide AWB separately
        updated_at: new Date().toISOString()
      })
      .eq('id', return_request_id)

    if (updateError) {
      console.error('Error updating return request:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        return_id: shiprocketResponse.return_id,
        status: shiprocketResponse.status,
        message: shiprocketResponse.message
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating Shiprocket return:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create Shiprocket return' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
