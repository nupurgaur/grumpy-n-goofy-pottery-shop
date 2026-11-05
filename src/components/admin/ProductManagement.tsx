import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminProducts } from '@/hooks/useAdminProducts';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Package, AlertTriangle, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ImageUpload } from './ImageUpload';
import { TemplatePdfUpload } from './TemplatePdfUpload';
import CustomPotManagement from './CustomPotManagement';
import { TEMPLATE_STOCK_QUANTITY, isTemplateProduct } from '@/config/templates';
import { isWorkshopProduct } from '@/config/workshops';
import { SHOP_CATEGORIES } from '@/config/shopCategories';

const ProductManagement = () => {
  const { products, loading, refreshProducts } = useAdminProducts();
  const { toast } = useToast();
  const [catalogTab, setCatalogTab] = useState<'products' | 'templates'>('products');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  const physicalProducts = useMemo(
    () => products.filter((p) => !isTemplateProduct(p) && !isWorkshopProduct(p)),
    [products],
  );
  const templateProducts = useMemo(
    () => products.filter((p) => isTemplateProduct(p)),
    [products],
  );

  const categories = [
    ...SHOP_CATEGORIES.map(({ value, label }) => ({ value, label })),
    { value: 'templates', label: 'Templates' },
    { value: 'general', label: 'General' },
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    original_price: '',
    category: 'general',
    images: [] as string[],
    stock_quantity: '',
    low_stock_threshold: '5',
    is_active: true,
    dimensions: '',
    weight: '',
    care: 'Microwave safe',
    origin: 'Handcrafted in India',
    is_template: false,
    template_pdf_url: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      original_price: '',
      category: 'general',
      images: [],
      stock_quantity: '',
      low_stock_threshold: '5',
      is_active: true,
      dimensions: '',
      weight: '',
      care: 'Microwave safe',
      origin: 'Handcrafted in India',
      is_template: false,
      template_pdf_url: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const savingAsTemplate = catalogTab === 'templates' || formData.is_template;

    if (savingAsTemplate && !formData.template_pdf_url) {
      toast({
        title: "PDF required",
        description: "Upload a template PDF before saving.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const savingAsTemplate = catalogTab === 'templates' || formData.is_template;
      const productData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        category: savingAsTemplate ? 'templates' : formData.category,
        image_url: formData.images.length > 0 ? formData.images[0] : '',
        images: formData.images,
        stock_quantity: savingAsTemplate
          ? TEMPLATE_STOCK_QUANTITY
          : parseInt(formData.stock_quantity),
        low_stock_threshold: savingAsTemplate ? 0 : parseInt(formData.low_stock_threshold),
        is_active: formData.is_active,
        is_template: savingAsTemplate,
        template_pdf_url: savingAsTemplate ? formData.template_pdf_url : null,
        dimensions: savingAsTemplate ? null : (formData.dimensions || null),
        weight: savingAsTemplate ? null : (formData.weight || null),
        care: savingAsTemplate ? null : formData.care,
        origin: savingAsTemplate ? null : formData.origin,
      };

      let error;
      if (editingProduct) {
        ({ error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id));
      } else {
        ({ error } = await supabase
          .from('products')
          .insert([productData]));
      }

      if (error) throw error;

      toast({
        title: editingProduct ? "Product updated" : "Product added",
        description: `${formData.name} has been ${editingProduct ? 'updated' : 'added'} successfully.`
      });

      resetForm();
      setIsAddDialogOpen(false);
      setEditingProduct(null);
      refreshProducts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: any) => {
    setCatalogTab(isTemplateProduct(product) ? 'templates' : 'products');
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      original_price: product.original_price?.toString() || '',
      category: product.category || 'general',
      images: product.images || (product.image_url ? [product.image_url] : []),
      stock_quantity: product.stock_quantity.toString(),
      low_stock_threshold: product.low_stock_threshold.toString(),
      is_active: product.is_active,
      dimensions: product.dimensions || '',
      weight: product.weight || '',
      care: product.care || 'Microwave safe',
      origin: product.origin || 'Handcrafted in India',
      is_template: product.is_template || false,
      template_pdf_url: product.template_pdf_url || '',
    });
    setIsAddDialogOpen(true);
  };

  const getStockBadge = (product: any) => {
    if (isTemplateProduct(product)) {
      return <Badge variant="default" className="bg-blue-100 text-blue-800">Digital Download</Badge>;
    }
    if (product.stock_quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (product.stock_quantity <= product.low_stock_threshold) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">In Stock</Badge>;
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    if (catalogTab === 'templates') {
      setFormData({
        name: '',
        description: '',
        price: '',
        original_price: '',
        category: 'templates',
        images: [],
        stock_quantity: String(TEMPLATE_STOCK_QUANTITY),
        low_stock_threshold: '0',
        is_active: true,
        dimensions: '',
        weight: '',
        care: 'Microwave safe',
        origin: 'Handcrafted in India',
        is_template: true,
        template_pdf_url: '',
      });
    } else {
      resetForm();
    }
    setIsAddDialogOpen(true);
  };

  const renderProductTable = (items: typeof products, emptyLabel: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">{emptyLabel}</h3>
          <p className="text-muted-foreground mb-4">
            Click add to create your first entry in this catalog.
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <img
                    src={(product.images && product.images.length > 0) ? product.images[0] : product.image_url}
                    alt={product.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                  <div className="font-medium">{product.name}</div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {categories.find((cat) => cat.value === product.category)?.label || 'General'}
                </Badge>
              </TableCell>
              <TableCell>
                <div>
                  ₹{product.price}
                  {product.original_price && (
                    <div className="text-sm text-muted-foreground line-through">
                      ₹{product.original_price}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {isTemplateProduct(product) ? '∞' : product.stock_quantity}
                  {!isTemplateProduct(product) && product.stock_quantity <= product.low_stock_threshold && (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getStockBadge(product)}
                  {!product.is_active && (
                    <Badge variant="secondary">Hidden</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="flex items-center gap-1"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const isTemplateForm = catalogTab === 'templates' || formData.is_template;

  return (
    <div className="space-y-6">
      <CustomPotManagement />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Catalog Management
              </CardTitle>
              <CardDescription>
                Manage physical products and digital templates separately
              </CardDescription>
            </div>
            <Button className="flex items-center gap-2 shrink-0" onClick={openAddDialog}>
              <Plus className="h-4 w-4" />
              {catalogTab === 'templates' ? 'Add Template' : 'Add Product'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={catalogTab} onValueChange={(v) => setCatalogTab(v as 'products' | 'templates')}>
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="products" className="gap-2">
                <Package className="h-4 w-4" />
                Products ({physicalProducts.length})
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                <FileDown className="h-4 w-4" />
                Templates ({templateProducts.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              {renderProductTable(physicalProducts, 'No physical products yet')}
            </TabsContent>
            <TabsContent value="templates">
              {renderProductTable(templateProducts, 'No templates yet')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? `Edit ${isTemplateForm ? 'Template' : 'Product'}`
                : `Add New ${isTemplateForm ? 'Template' : 'Product'}`}
            </DialogTitle>
            <DialogDescription>
              {isTemplateForm
                ? 'Digital PDF template — instant download after purchase'
                : 'Physical pottery product for the shop'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-3 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={isTemplateForm ? 'Slab Building Template' : 'Handcrafted Pottery Bowl'}
                  required
                />
              </div>

              {!isTemplateForm && (
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.filter((c) => c.value !== 'templates').map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <ImageUpload
                images={formData.images}
                onChange={(images) => setFormData(prev => ({ ...prev, images }))}
                maxImages={5}
              />

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={5}
                  placeholder="Use blank lines between paragraphs. Lines starting with - become bullets. Wrap text in **double asterisks** for bold."
                />
              </div>

              {isTemplateForm && (
                <TemplatePdfUpload
                  pdfUrl={formData.template_pdf_url}
                  onChange={(url) => setFormData((prev) => ({ ...prev, template_pdf_url: url }))}
                />
              )}

              {!isTemplateForm && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="dimensions">Dimensions</Label>
                    <Input
                      id="dimensions"
                      value={formData.dimensions}
                      onChange={e => setFormData(prev => ({ ...prev, dimensions: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight</Label>
                    <Input
                      id="weight"
                      value={formData.weight}
                      onChange={e => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="care">Care</Label>
                    <Input
                      id="care"
                      value={formData.care}
                      onChange={e => setFormData(prev => ({ ...prev, care: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price</Label>
                  <Input
                    id="original_price"
                    type="number"
                    step="0.01"
                    value={formData.original_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                  />
                </div>
              </div>

              {!isTemplateForm && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Stock Quantity *</Label>
                    <Input
                      id="stock_quantity"
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_quantity: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
                    <Input
                      id="low_stock_threshold"
                      type="number"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active" className="text-sm">Published (visible on site)</Label>
              </div>
            </div>

            <DialogFooter className="flex-shrink-0 bg-background pt-3 border-t">
              <Button type="submit" className="w-full">
                {editingProduct ? 'Save changes' : `Add ${isTemplateForm ? 'template' : 'product'}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductManagement;