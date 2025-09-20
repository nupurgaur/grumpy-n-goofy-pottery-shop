import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Package, AlertTriangle, Eye } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { useState } from "react";
import mugImage from "@/assets/pottery-mug.jpg";
import vaseImage from "@/assets/pottery-vase.jpg";
import bowlImage from "@/assets/pottery-bowl.jpg";
import heroImage from "@/assets/pottery-hero.jpg";
import textureBg from "@/assets/pottery-texture-bg.jpg";

// Consistent fallback images for all products
const getProductImages = (product: any) => {
  // Use a consistent set of images for all products
  const consistentImages = [mugImage, vaseImage, bowlImage, heroImage];
  
  // If product has images, use them, otherwise use consistent fallbacks
  if (product.images && product.images.length > 0) {
    return product.images.map(img => {
      if (img.includes('pottery-mug')) return mugImage;
      if (img.includes('pottery-vase')) return vaseImage;
      if (img.includes('pottery-bowl')) return bowlImage;
      return img;
    });
  }
  
  // Return consistent fallback images
  return consistentImages;
};

const getProductImage = (imageUrl: string) => {
  if (imageUrl.includes('pottery-mug')) return mugImage;
  if (imageUrl.includes('pottery-vase')) return vaseImage;
  if (imageUrl.includes('pottery-bowl')) return bowlImage;
  return imageUrl;
};

const FeaturedProducts = () => {
  const { addItem } = useCart();
  const { products, loading, getStockStatus, isLowStock } = useProducts();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImage(product.image_url)
    }, product.stock_quantity);
  };

  const handleWishlistToggle = async (product: any) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const handleProductClick = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
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
      <section
        id="shop"
        className="py-20 bg-muted/30"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(${textureBg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '600px 600px',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll'
        }}
      >
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
    <section
      id="shop"
      className="py-20 bg-muted/30"
      style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.92), rgba(255,255,255,0.92)), url(${textureBg})`,
        backgroundRepeat: 'repeat',
        backgroundSize: '600px 600px',
        backgroundPosition: 'center',
        backgroundAttachment: 'scroll'
      }}
    >
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
              <Card key={product.id} className="group hover-lift border-0 shadow-card bg-card-gradient overflow-hidden cursor-pointer" onClick={() => handleProductClick(product)}>
                <div className="relative overflow-hidden aspect-square">
                  <ProductImageCarousel
                    images={getProductImages(product)}
                    alt={product.name}
                    className={`w-full h-full ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                    showArrows={true}
                    showDots={true}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      handleWishlistToggle(product);
                    }}
                  >
                    <Heart className={`h-4 w-4 ${
                      isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''
                    }`} />
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
                          ₹{product.price}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            ₹{product.original_price}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProductClick(product);
                          }}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button 
                          variant="accent" 
                          size="sm" 
                          className="group"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product);
                          }}
                          disabled={isOutOfStock}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </Button>
                      </div>
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

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </section>
  );
};

export default FeaturedProducts;