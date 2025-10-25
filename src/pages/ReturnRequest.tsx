import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft,
  Package,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'> & {
  order_items: Tables<'order_items'>[];
};

type ReturnRequest = Tables<'return_requests'>;

const returnReasons = [
  { value: 'defective', label: 'Defective Product' },
  { value: 'wrong_item', label: 'Wrong Item Received' },
  { value: 'not_as_described', label: 'Not as Described' },
  { value: 'changed_mind', label: 'Changed Mind' },
  { value: 'other', label: 'Other' }
];

const ReturnRequestPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [existingReturn, setExistingReturn] = useState<ReturnRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    pickupAddress: ''
  });

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

      // Check if order can be returned
      if (orderData.fulfillment_status !== 'delivered') {
        throw new Error('Order must be delivered to request a return');
      }

      // Check for existing return request
      const { data: returnData, error: returnError } = await supabase
        .from('return_requests')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (returnError && returnError.code !== 'PGRST116') {
        console.error('Error checking existing return:', returnError);
      }

      setOrder(orderData as Order);
      setExistingReturn(returnData);

      // Set default pickup address
      let shippingAddress;
      try {
        shippingAddress = typeof orderData.address_snapshot === 'string' 
          ? JSON.parse(orderData.address_snapshot) 
          : orderData.address_snapshot || orderData.shipping_address;
      } catch {
        shippingAddress = orderData.shipping_address;
      }

      setFormData(prev => ({
        ...prev,
        pickupAddress: typeof shippingAddress === 'string' 
          ? shippingAddress 
          : shippingAddress?.address || orderData.shipping_address
      }));

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!order || !user) return;

    try {
      setSubmitting(true);

      const { error } = await supabase
        .from('return_requests')
        .insert({
          order_id: order.id,
          reason: formData.reason,
          description: formData.description,
          pickup_address: formData.pickupAddress,
          status: 'pending'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Return Request Submitted",
        description: "Your return request has been submitted successfully. We'll review it and get back to you soon."
      });

      navigate(`/orders/${order.id}`);
    } catch (error: any) {
      console.error('Error submitting return request:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit return request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
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
          <div className="max-w-2xl mx-auto text-center">
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

  if (existingReturn) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" onClick={() => navigate(`/orders/${order.id}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Order
              </Button>
              <h1 className="text-3xl font-bold text-brand-primary">Return Request</h1>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Return Request Already Submitted
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium capitalize">{existingReturn.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reason:</span>
                    <p className="font-medium capitalize">{existingReturn.reason.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requested:</span>
                    <p className="font-medium">
                      {new Date(existingReturn.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  {existingReturn.approved_at && (
                    <div>
                      <span className="text-muted-foreground">Approved:</span>
                      <p className="font-medium">
                        {new Date(existingReturn.approved_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {existingReturn.description && (
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1">{existingReturn.description}</p>
                  </div>
                )}

                {existingReturn.status === 'approved' && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800 font-medium">
                      Your return request has been approved! We'll arrange pickup soon.
                    </p>
                  </div>
                )}

                {existingReturn.status === 'rejected' && (
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-red-800 font-medium">
                      Your return request has been rejected. Please contact support for more information.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => navigate(`/orders/${order.id}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Order
            </Button>
            <h1 className="text-3xl font-bold text-brand-primary">Request Return</h1>
          </div>

          {/* Order Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-medium">#{order.id.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="font-medium">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">₹{order.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items</span>
                  <span className="font-medium">{order.order_items.length} item(s)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Return Request Form */}
          <Card>
            <CardHeader>
              <CardTitle>Return Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="reason">Reason for Return *</Label>
                  <Select value={formData.reason} onValueChange={(value) => setFormData(prev => ({ ...prev, reason: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {returnReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>
                          {reason.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Additional Details</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Please provide additional details about the return..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="pickupAddress">Pickup Address *</Label>
                  <Textarea
                    id="pickupAddress"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, pickupAddress: e.target.value }))}
                    placeholder="Enter the address where the items should be picked up from"
                    rows={3}
                    required
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Return Policy</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Returns are accepted within 7 days of delivery</li>
                    <li>• Items must be in original condition with packaging</li>
                    <li>• Return shipping charges may apply</li>
                    <li>• Refund will be processed after inspection</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !formData.reason || !formData.pickupAddress}
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Return Request'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReturnRequestPage;
