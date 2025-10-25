import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Search,
  RefreshCw,
  ExternalLink,
  Eye,
  Download
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'> & {
  order_items: Tables<'order_items'>[];
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

const OrderQueue = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingOrders, setProcessingOrders] = useState<Set<string>>(new Set());

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setOrders(data as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createShipment = async (orderId: string) => {
    try {
      setProcessingOrders(prev => new Set(prev).add(orderId));
      
      const { data, error } = await supabase.functions.invoke('shiprocket-create-order', {
        body: { order_id: orderId }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to create shipment');
      }

      toast({
        title: "Shipment Created",
        description: `Shipment created successfully. AWB: ${data.awb_codes?.[0] || 'N/A'}`
      });

      // Refresh orders
      fetchOrders();
    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast({
        title: "Shipment Creation Failed",
        description: error.message || "Failed to create shipment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ fulfillment_status: status })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Order status updated to ${getStatusText(status)}`
      });

      // Refresh orders
      fetchOrders();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update order status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.fulfillment_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchOrders} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">Order #{order.id.slice(-8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_name} • {order.customer_email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(order.fulfillment_status)}>
                    {getStatusText(order.fulfillment_status)}
                  </Badge>
                  <div className="text-right">
                    <p className="font-semibold">₹{order.total_amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.order_items.length} item(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                      <img 
                        src={item.product_image} 
                        alt={item.product_name}
                        className="w-8 h-8 object-cover rounded"
                      />
                      <span className="truncate">{item.product_name}</span>
                      <span className="text-muted-foreground">×{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Shipping Address:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {typeof order.address_snapshot === 'string' 
                    ? order.address_snapshot 
                    : order.address_snapshot?.address || order.shipping_address}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {!order.shiprocket_order_id && order.payment_status === 'paid' && (
                  <Button
                    size="sm"
                    onClick={() => createShipment(order.id)}
                    disabled={processingOrders.has(order.id)}
                  >
                    {processingOrders.has(order.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4 mr-2" />
                        Create Shipment
                      </>
                    )}
                  </Button>
                )}

                {order.shiprocket_order_id && (
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Shiprocket ID: {order.shiprocket_order_id}
                    </Badge>
                    {order.awb && (
                      <Badge variant="outline">
                        AWB: {order.awb}
                      </Badge>
                    )}
                    {order.tracking_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(order.tracking_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Track
                      </Button>
                    )}
                    {order.label_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(order.label_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Label
                      </Button>
                    )}
                  </div>
                )}

                {/* Status Update Buttons */}
                <div className="flex gap-1">
                  {order.fulfillment_status === 'processing' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                    >
                      Mark Shipped
                    </Button>
                  )}
                  {order.fulfillment_status === 'shipped' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'out_for_delivery')}
                    >
                      Out for Delivery
                    </Button>
                  )}
                  {order.fulfillment_status === 'out_for_delivery' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                    >
                      Mark Delivered
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No orders match your current filters.' 
                  : 'No orders have been placed yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OrderQueue;
