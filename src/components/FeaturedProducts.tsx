import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Package, AlertTriangle } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import mugImage from "@/assets/pottery-mug.jpg";
import vaseImage from "@/assets/pottery-vase.jpg";
import bowlImage from "@/assets/pottery-bowl.jpg";

// Fallback images for products
const getProductImage = (imageUrl: string) => {
  if (imageUrl.includes('pottery-mug')) return mugImage;
  if (imageUrl.includes('pottery-vase')) return vaseImage;
  if (imageUrl.includes('pottery-bowl')) return bowlImage;
  return imageUrl;
};

const FeaturedProducts = () => {
  const { addItem } = useCart();
  const { products, loading, getStockStatus, isLowStock } = useProducts();

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImage(product.image_url)
    }, product.stock_quantity);
  };

  const getStockBadge = (product: any) => {
    const status = getStockStatus(product);
    switch (status) {
      case 'out-of-stock':
        return (
          <Badge variant="destructive" className="absolute top-4 right-14">
            <Package className="h-3 w-3 mr-1" />
            Out of Stock
          </Badge>
        );
      case 'low-stock':
        return (
          <Badge variant="secondary" className="absolute top-4 right-14 bg-yellow-500 text-yellow-50">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Low Stock ({product.stock_quantity})
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <section id="shop" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-brand-primary mb-4">
              Featured Collection
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Loading our amazing pottery collection...
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-64 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-6 bg-muted rounded w-1/4"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }
  return (
    <section id="shop" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-brand-primary mb-4">
            Featured Collection
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Each piece tells a story - quirky, functional, and made with love
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => {
            const stockStatus = getStockStatus(product);
            const isOutOfStock = stockStatus === 'out-of-stock';
            
            return (
              <Card key={product.id} className="group hover-lift border-0 shadow-card bg-card-gradient overflow-hidden">
                <div className="relative overflow-hidden">
                  <img
                    src={getProductImage(product.image_url)}
                    alt={product.name}
                    className={`w-full h-64 object-cover group-hover:scale-110 transition-smooth ${
                      isOutOfStock ? 'opacity-60 grayscale' : ''
                    }`}
                  />
                  {product.is_featured && (
                    <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground">
                      Featured
                    </Badge>
                  )}
                  {getStockBadge(product)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Rating */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? "fill-accent-dark text-accent-dark"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {product.rating} ({product.review_count})
                      </span>
                    </div>

                    {/* Product Info */}
                    <div>
                      <h3 className="text-xl font-semibold text-brand-primary mb-2">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4">
                        {product.description}
                      </p>
                    </div>

                    {/* Stock Status */}
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className={`text-sm ${
                        isOutOfStock ? 'text-destructive' : 
                        isLowStock(product) ? 'text-yellow-600' : 
                        'text-green-600'
                      }`}>
                        {isOutOfStock ? 'Out of Stock' : 
                         isLowStock(product) ? `Low Stock (${product.stock_quantity} left)` : 
                         `${product.stock_quantity} in stock`}
                      </span>
                    </div>

                    {/* Price and Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl font-bold text-brand-primary">
                          ${product.price}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ${product.original_price}
                          </span>
                        )}
                      </div>
                      <Button 
                        variant="accent" 
                        size="sm" 
                        className="group"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button variant="outline" size="lg">
            View All Products
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;