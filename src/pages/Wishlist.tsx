import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, Star, Package, Trash2, ArrowLeft, Eye } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Product } from "@/hooks/useProducts";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { useState } from "react";

// Fallback images for products
const getProductImage = (imageUrl: string) => {
  if (imageUrl.includes('pottery-mug')) return '/src/assets/pottery-mug.jpg';
  if (imageUrl.includes('pottery-vase')) return '/src/assets/pottery-vase.jpg';
  if (imageUrl.includes('pottery-bowl')) return '/src/assets/pottery-bowl.jpg';
  return imageUrl;
};

const Wishlist = () => {
  const { wishlist, loading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: getProductImage(product.image_url)
    }, product.stock_quantity);
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    await removeFromWishlist(productId);
  };

  const handleClearWishlist = async () => {
    await clearWishlist();
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedProduct(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Sign in to view your wishlist</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to access your saved items
            </p>
            <Button onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-3xl lg:text-4xl font-bold text-brand-primary mb-4">
              My Wishlist
            </h1>
            <p className="text-xl text-muted-foreground">
              Loading your saved items...
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-brand-primary mb-2">
                My Wishlist
              </h1>
              <p className="text-xl text-muted-foreground">
                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
              </p>
            </div>
          </div>
          {wishlist.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearWishlist}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="h-24 w-24 mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Your wishlist is empty</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Start adding items you love to your wishlist by clicking the heart icon on any product
            </p>
            <Button onClick={() => navigate('/')}>
              Browse Products
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlist.map((item) => {
              const product = item.product;
              if (!product) return null;

              const isOutOfStock = product.stock_quantity === 0;
              const isLowStock = product.stock_quantity <= product.low_stock_threshold;

              return (
                <Card key={item.id} className="group hover-lift border-0 shadow-card bg-card-gradient overflow-hidden cursor-pointer" onClick={() => handleProductClick(product)}>
                  <div className="relative h-64 w-full overflow-hidden bg-muted flex items-center justify-center">
                    <ProductImageCarousel
                      images={product.images && product.images.length > 0 
                        ? product.images.map(img => getProductImage(img))
                        : [getProductImage(product.image_url)]
                      }
                      alt={product.name}
                      className={`h-64 w-full object-cover ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                      showArrows={true}
                      showDots={true}
                    />
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
                          isLowStock ? 'text-yellow-600' : 
                          'text-green-600'
                        }`}>
                          {isOutOfStock ? 'Out of Stock' : 
                           isLowStock ? `Low Stock (${product.stock_quantity} left)` : 
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
        )}
      </div>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
};

export default Wishlist;
