import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Package,
  Truck,
  Download
} from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type ReturnRequest = Tables<'return_requests'> & {
  orders: Tables<'orders'> & {
    order_items: Tables<'order_items'>[];
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'return_shipped':
      return 'bg-blue-100 text-blue-800';
    case 'returned':
      return 'bg-purple-100 text-purple-800';
    case 'refunded':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'return_shipped':
      return 'Return Shipped';
    case 'returned':
      return 'Returned';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
};

const getReasonText = (reason: string) => {
  switch (reason) {
    case 'defective':
      return 'Defective Product';
    case 'wrong_item':
      return 'Wrong Item Received';
    case 'not_as_described':
      return 'Not as Described';
    case 'changed_mind':
      return 'Changed Mind';
    case 'other':
      return 'Other';
    default:
      return reason;
  }
};

const ReturnsQueue = () => {
  const { toast } = useToast();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingReturns, setProcessingReturns] = useState<Set<string>>(new Set());
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('return_requests')
        .select(`
          *,
          orders (
            *,
            order_items (*)
          )
        `)
        .order('requested_at', { ascending: false });

      if (error) {
        throw error;
      }

      setReturns(data as ReturnRequest[]);
    } catch (error: any) {
      console.error('Error fetching returns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch return requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const approveReturn = async (returnId: string) => {
    try {
      setProcessingReturns(prev => new Set(prev).add(returnId));
      
      const { error } = await supabase
        .from('return_requests')
        .update({ 
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', returnId);

      if (error) {
        throw error;
      }

      toast({
        title: "Return Approved",
        description: "Return request has been approved successfully."
      });

      // Refresh returns
      fetchReturns();
    } catch (error: any) {
      console.error('Error approving return:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve return request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingReturns(prev => {
        const newSet = new Set(prev);
        newSet.delete(returnId);
        return newSet;
      });
    }
  };

  const rejectReturn = async (returnId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingReturns(prev => new Set(prev).add(returnId));
      
      const { error } = await supabase
        .from('return_requests')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          description: rejectionReason
        })
        .eq('id', returnId);

      if (error) {
        throw error;
      }

      toast({
        title: "Return Rejected",
        description: "Return request has been rejected."
      });

      setRejectionReason('');
      setSelectedReturn(null);
      // Refresh returns
      fetchReturns();
    } catch (error: any) {
      console.error('Error rejecting return:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject return request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingReturns(prev => {
        const newSet = new Set(prev);
        newSet.delete(returnId);
        return newSet;
      });
    }
  };

  const createReturnShipment = async (returnId: string) => {
    try {
      setProcessingReturns(prev => new Set(prev).add(returnId));
      
      const { data, error } = await supabase.functions.invoke('shiprocket-create-return', {
        body: { return_request_id: returnId }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Failed to create return shipment');
      }

      toast({
        title: "Return Shipment Created",
        description: `Return shipment created successfully. Return ID: ${data.return_id}`
      });

      // Refresh returns
      fetchReturns();
    } catch (error: any) {
      console.error('Error creating return shipment:', error);
      toast({
        title: "Return Shipment Failed",
        description: error.message || "Failed to create return shipment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingReturns(prev => {
        const newSet = new Set(prev);
        newSet.delete(returnId);
        return newSet;
      });
    }
  };

  const filteredReturns = returns.filter(returnReq => {
    const matchesSearch = 
      returnReq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnReq.orders.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      returnReq.orders.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || returnReq.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchReturns();
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
            <RefreshCw className="h-5 w-5" />
            Returns Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search returns..."
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="return_shipped">Return Shipped</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchReturns} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <div className="space-y-4">
        {filteredReturns.map((returnReq) => (
          <Card key={returnReq.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-semibold">Return #{returnReq.id.slice(-8)}</h3>
                    <p className="text-sm text-muted-foreground">
                      Order #{returnReq.orders.id.slice(-8)} • {returnReq.orders.customer_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Requested: {new Date(returnReq.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={getStatusColor(returnReq.status)}>
                    {getStatusText(returnReq.status)}
                  </Badge>
                  <div className="text-right">
                    <p className="font-semibold">₹{returnReq.orders.total_amount}</p>
                    <p className="text-sm text-muted-foreground">
                      {getReasonText(returnReq.reason)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Return Details */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Return Reason:</p>
                <p className="text-sm text-muted-foreground mb-2">
                  {getReasonText(returnReq.reason)}
                </p>
                {returnReq.description && (
                  <>
                    <p className="text-sm font-medium mb-1">Description:</p>
                    <p className="text-sm text-muted-foreground">{returnReq.description}</p>
                  </>
                )}
              </div>

              {/* Pickup Address */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium mb-1">Pickup Address:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {typeof returnReq.pickup_address === 'string' 
                    ? returnReq.pickup_address 
                    : returnReq.pickup_address?.address || 'Not specified'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap">
                {returnReq.status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => approveReturn(returnReq.id)}
                      disabled={processingReturns.has(returnReq.id)}
                    >
                      {processingReturns.has(returnReq.id) ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setSelectedReturn(returnReq)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                )}

                {returnReq.status === 'approved' && (
                  <Button
                    size="sm"
                    onClick={() => createReturnShipment(returnReq.id)}
                    disabled={processingReturns.has(returnReq.id)}
                  >
                    {processingReturns.has(returnReq.id) ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Truck className="h-4 w-4 mr-2" />
                        Create Return Shipment
                      </>
                    )}
                  </Button>
                )}

                {returnReq.return_shipment_id && (
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Return ID: {returnReq.return_shipment_id}
                    </Badge>
                    {returnReq.return_awb && (
                      <Badge variant="outline">
                        AWB: {returnReq.return_awb}
                      </Badge>
                    )}
                    {returnReq.return_label_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(returnReq.return_label_url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Return Label
                      </Button>
                    )}
                  </div>
                )}

                {/* Status Update Buttons */}
                <div className="flex gap-1">
                  {returnReq.status === 'return_shipped' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Update return status to returned
                        supabase
                          .from('return_requests')
                          .update({ status: 'returned' })
                          .eq('id', returnReq.id)
                          .then(() => {
                            toast({
                              title: "Status Updated",
                              description: "Return marked as received"
                            });
                            fetchReturns();
                          });
                      }}
                    >
                      Mark Returned
                    </Button>
                  )}
                  {returnReq.status === 'returned' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // Update return status to refunded
                        supabase
                          .from('return_requests')
                          .update({ status: 'refunded' })
                          .eq('id', returnReq.id)
                          .then(() => {
                            toast({
                              title: "Status Updated",
                              description: "Return marked as refunded"
                            });
                            fetchReturns();
                          });
                      }}
                    >
                      Mark Refunded
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredReturns.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Return Requests Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No return requests match your current filters.' 
                  : 'No return requests have been submitted yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rejection Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Reject Return Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                <Textarea
                  id="rejectionReason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Please provide a reason for rejecting this return request..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedReturn(null);
                    setRejectionReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => rejectReturn(selectedReturn.id)}
                  disabled={!rejectionReason.trim() || processingReturns.has(selectedReturn.id)}
                  className="flex-1"
                >
                  {processingReturns.has(selectedReturn.id) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Rejecting...
                    </>
                  ) : (
                    'Reject Return'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReturnsQueue;
