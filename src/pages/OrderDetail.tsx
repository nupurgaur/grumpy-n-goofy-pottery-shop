import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  ExternalLink,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'> & {
  order_items: Tables<'order_items'>[];
};

type OrderEvent = Tables<'order_events'>;

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'delivered':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'shipped':
    case 'out_for_delivery':
      return <Truck className="h-5 w-5 text-blue-600" />;
    case 'cancelled':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'returned':
      return <RefreshCw className="h-5 w-5 text-orange-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-green-100 text-green-800';
    case 'shipped':
    case 'out_for_delivery':
      return 'bg-blue-100 text-blue-800';
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'returned':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'returned':
      return 'Returned';
    default:
      return status;
  }
};

const OrderDetailPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = async () => {
    if (!orderId || !user) return;

    try {
      setLoading(true);
      
      // Fetch order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (orderError || !orderData) {
        throw new Error('Order not found');
      }

      // Fetch order events
      const { data: eventsData, error: eventsError } = await supabase
        .from('order_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
      }

      setOrder(orderData as Order);
      setEvents(eventsData || []);
    } catch (error: any) {
      console.error('Error fetching order details:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch order details.",
        variant: "destructive"
      });
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      const { data, error } = await supabase.functions.invoke('shiprocket-cancel-order', {
        body: { order_id: order.id }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to cancel order');
      }

      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully."
      });

      // Refresh order details
      fetchOrderDetails();
    } catch (error: any) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Cancellation Failed",
        description: error.message || "Failed to cancel order. Please try again.",
        variant: "destructive"
      });
    }
  };

  const canCancelOrder = (order: Order) => {
    return order.fulfillment_status === 'pending' || order.fulfillment_status === 'processing';
  };

  const canRequestReturn = (order: Order) => {
    return order.fulfillment_status === 'delivered';
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-brand-primary mb-4">Order Not Found</h1>
            <p className="text-muted-foreground mb-4">The order you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/orders')}>
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Parse address
  let shippingAddress;
  try {
    shippingAddress = typeof order.address_snapshot === 'string' 
      ? JSON.parse(order.address_snapshot) 
      : order.address_snapshot || order.shipping_address;
  } catch {
    shippingAddress = order.shipping_address;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate('/orders')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <h1 className="text-3xl font-bold text-brand-primary">Order Details</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Order Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(order.fulfillment_status)}
                      <div>
                        <CardTitle className="text-xl">Order #{order.id.slice(-8)}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(order.fulfillment_status)}>
                      {getStatusText(order.fulfillment_status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {order.tracking_url && (
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant="outline"
                        onClick={() => window.open(order.tracking_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track Package
                      </Button>
                      {order.awb && (
                        <span className="text-sm text-muted-foreground">
                          AWB: {order.awb}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {order.courier && (
                    <p className="text-sm text-muted-foreground">
                      Courier: {order.courier}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <img 
                          src={item.product_image} 
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium">{item.product_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            ₹{item.product_price} × {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">₹{item.subtotal}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Amount</span>
                    <span>₹{order.total_amount}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              {events.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Order Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {events.map((event, index) => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-brand-primary rounded-full mt-2"></div>
                          <div className="flex-1">
                            <p className="font-medium">{event.status}</p>
                            {event.note && (
                              <p className="text-sm text-muted-foreground">{event.note}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                    {order.customer_phone && (
                      <p className="text-sm text-muted-foreground">{order.customer_phone}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">
                    {typeof shippingAddress === 'string' 
                      ? shippingAddress 
                      : shippingAddress?.address || order.shipping_address}
                  </p>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Method</span>
                    <span className="text-sm font-medium">
                      {order.payment_method === 'razorpay' ? 'Razorpay' : order.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Status</span>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'destructive'}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    {canCancelOrder(order) && (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleCancelOrder}
                      >
                        Cancel Order
                      </Button>
                    )}
                    
                    {canRequestReturn(order) && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/orders/${order.id}/return`)}
                      >
                        Request Return
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
