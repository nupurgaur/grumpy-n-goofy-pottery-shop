import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useProducts } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Package, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface InventoryMovement {
  id: string;
  product_id: number;
  movement_type: 'sale' | 'restock' | 'adjustment';
  quantity_change: number;
  previous_stock: number;
  new_stock: number;
  notes: string | null;
  created_at: string;
}

const InventoryOverview = () => {
  const { products, loading, updateStock, refreshProducts } = useProducts();
  const { toast } = useToast();
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [movementsLoading, setMovementsLoading] = useState(false);

  // Form state for stock update
  const [updateData, setUpdateData] = useState({
    quantity_change: '',
    movement_type: 'restock' as 'sale' | 'restock' | 'adjustment',
    notes: ''
  });

  const loadMovements = async () => {
    setMovementsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMovements((data || []).map(item => ({
        ...item,
        movement_type: item.movement_type as 'sale' | 'restock' | 'adjustment'
      })));
    } catch (error: any) {
      toast({
        title: "Error loading movements",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setMovementsLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  const handleStockUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    const quantityChange = parseInt(updateData.quantity_change);
    if (isNaN(quantityChange) || quantityChange === 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity change",
        variant: "destructive"
      });
      return;
    }

    const success = await updateStock(
      selectedProduct.id,
      quantityChange,
      updateData.movement_type,
      updateData.notes || undefined
    );

    if (success) {
      setIsUpdateDialogOpen(false);
      setSelectedProduct(null);
      setUpdateData({
        quantity_change: '',
        movement_type: 'restock',
        notes: ''
      });
      loadMovements(); // Refresh movements
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case 'restock':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'adjustment':
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'sale':
        return <Badge variant="destructive">Sale</Badge>;
      case 'restock':
        return <Badge variant="default" className="bg-green-100 text-green-800">Restock</Badge>;
      case 'adjustment':
        return <Badge variant="secondary">Adjustment</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.low_stock_threshold);
  const outOfStockProducts = products.filter(p => p.stock_quantity === 0);
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Inventory Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <BarChart3 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">{outOfStockProducts.length} out of stock</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Stock Management
              </CardTitle>
              <CardDescription>
                Update stock levels and manage inventory
              </CardDescription>
            </div>
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Update Stock</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Stock Level</DialogTitle>
                  <DialogDescription>
                    Adjust inventory for {selectedProduct?.name}
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleStockUpdate}>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="product">Product</Label>
                      <Select
                        value={selectedProduct?.id?.toString() || ''}
                        onValueChange={(value) => {
                          const product = products.find(p => p.id.toString() === value);
                          setSelectedProduct(product);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} (Current: {product.stock_quantity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="movement_type">Movement Type</Label>
                      <Select
                        value={updateData.movement_type}
                        onValueChange={(value: 'sale' | 'restock' | 'adjustment') =>
                          setUpdateData(prev => ({ ...prev, movement_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="restock">Restock (+)</SelectItem>
                          <SelectItem value="adjustment">Adjustment (+/-)</SelectItem>
                          <SelectItem value="sale">Sale (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity_change">
                        Quantity Change {updateData.movement_type === 'sale' ? '(will be negative)' : ''}
                      </Label>
                      <Input
                        id="quantity_change"
                        type="number"
                        value={updateData.quantity_change}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, quantity_change: e.target.value }))}
                        placeholder={updateData.movement_type === 'sale' ? '-5' : '10'}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes (optional)</Label>
                      <Textarea
                        id="notes"
                        value={updateData.notes}
                        onChange={(e) => setUpdateData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Reason for stock change..."
                        rows={2}
                      />
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button type="submit" disabled={!selectedProduct}>
                      Update Stock
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Low Stock Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                      />
                      <div className="font-medium">{product.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{product.stock_quantity}</TableCell>
                  <TableCell className="font-mono">{product.low_stock_threshold}</TableCell>
                  <TableCell>
                    {product.stock_quantity === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : product.stock_quantity <= product.low_stock_threshold ? (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsUpdateDialogOpen(true);
                      }}
                    >
                      Update
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Movements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Recent Inventory Movements
          </CardTitle>
          <CardDescription>
            Latest stock changes and transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {movementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary"></div>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory movements yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Stock (Before → After)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement) => {
                  const product = products.find(p => p.id === movement.product_id);
                  return (
                    <TableRow key={movement.id}>
                      <TableCell>{product?.name || `Product ${movement.product_id}`}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.movement_type)}
                          {getMovementBadge(movement.movement_type)}
                        </div>
                      </TableCell>
                      <TableCell className={`font-mono ${movement.quantity_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change}
                      </TableCell>
                      <TableCell className="font-mono">
                        {movement.previous_stock} → {movement.new_stock}
                      </TableCell>
                      <TableCell>
                        {new Date(movement.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {movement.notes || '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryOverview;