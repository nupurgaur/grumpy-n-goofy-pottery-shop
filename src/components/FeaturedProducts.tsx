import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Heart, Star, Package, AlertTriangle, Eye } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useProducts } from "@/hooks/useProducts";
import { useWishlist } from "@/hooks/useWishlist";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductDetailDialog } from "@/components/ProductDetailDialog";
import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import mugImage from "@/assets/IMG20250927153335.jpg";
import vaseImage from "@/assets/IMG20250927152142.jpg";
import bowlImage from "@/assets/IMG20250927153430.jpg";
import heroImage from "@/assets/IMG_20250929_021501.jpg";
import textureBg from "@/assets/IMG20250927152142.jpg";
import potteryTexture from "@/assets/IMG20250927151704.jpg";
import potteryTexture2 from "@/assets/IMG20250927152654.jpg";

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
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const hasCategoryParam = location.search.includes('category=');
  const category = params.get('category') || 'all';
  const isHomeFeatured = !hasCategoryParam; // true homepage: no category filter present
  const { products, loading, getStockStatus, isLowStock } = useProducts(category, { featuredOnly: isHomeFeatured });
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 0]);
  const [sortOrder, setSortOrder] = useState<'none' | 'price-asc' | 'price-desc' | 'alpha-asc' | 'alpha-desc'>('none');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pricePreset, setPricePreset] = useState<'all' | 'under-500' | '500-1000' | '1000-2000' | '2000-plus'>('all');

  // Setup price bounds from loaded products (All Products page only)
  useEffect(() => {
    if (!loading && products.length > 0) {
      const prices = products.map(p => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setPriceBounds([min, max]);
      // bounds used for presets upper/lower caps
    }
  }, [loading, products]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const showFilters = !isHomeFeatured; // show filters on any category page, including 'all'

  const filteredAndSortedProducts = useMemo(() => {
    let list = products;
    if (showFilters) {
      // Category filter applies only on All Products page (data already scoped on category pages)
      if (category === 'all' && categoryFilter !== 'all') {
        list = list.filter(p => p.category === categoryFilter);
      }
      // Price presets
      list = list.filter(p => {
        const price = p.price;
        switch (pricePreset) {
          case 'under-500':
            return price < 500;
          case '500-1000':
            return price >= 500 && price <= 1000;
          case '1000-2000':
            return price >= 1000 && price <= 2000;
          case '2000-plus':
            return price >= 2000;
          default:
            return true;
        }
      });
      // Sorting
      if (sortOrder === 'price-asc') {
        list = [...list].sort((a, b) => a.price - b.price);
      } else if (sortOrder === 'price-desc') {
        list = [...list].sort((a, b) => b.price - a.price);
      } else if (sortOrder === 'alpha-asc') {
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOrder === 'alpha-desc') {
        list = [...list].sort((a, b) => b.name.localeCompare(a.name));
      }
    }
    return list;
  }, [products, showFilters, categoryFilter, pricePreset, sortOrder]);

  const productCount = filteredAndSortedProducts.length;
  

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
            {isHomeFeatured
              ? 'Featured Products'
              : category === 'all'
                ? 'All Products'
                : `${category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`}
          </h2>
          {category === 'all' && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Each piece tells a story - quirky, functional, and made with love
            </p>
          )}
        </div>

        {/* Filters Toolbar (All Products page) */}
        {showFilters && (
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm text-muted-foreground">Filter:</span>
              {category === 'all' && (
                <div className="min-w-[220px]">
                  <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {allCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.replace(/-/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="min-w-[220px]">
                <Select value={pricePreset} onValueChange={(v) => setPricePreset(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Prices</SelectItem>
                    <SelectItem value="under-500">Under ₹500</SelectItem>
                    <SelectItem value="500-1000">₹500 – ₹1,000</SelectItem>
                    <SelectItem value="1000-2000">₹1,000 – ₹2,000</SelectItem>
                    <SelectItem value="2000-plus">₹2,000 and up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <div className="min-w-[220px]">
                <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Relevance</SelectItem>
                    <SelectItem value="alpha-asc">Alphabetically, A–Z</SelectItem>
                    <SelectItem value="alpha-desc">Alphabetically, Z–A</SelectItem>
                    <SelectItem value="price-asc">Price, low to high</SelectItem>
                    <SelectItem value="price-desc">Price, high to low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <span className="text-muted-foreground text-sm whitespace-nowrap">{productCount} products</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="mb-12">
            <Card className="border-0 shadow-card">
              <CardContent className="p-12 text-center">
                <h3 className="text-xl font-semibold text-brand-primary mb-2">
                  {category === 'all' ? 'No results found' : 'No products in this category yet'}
                </h3>
                {category === 'all' && (
                  <p className="text-muted-foreground">Try adjusting Category, Price, or Sort options.</p>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
        /* Products Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {filteredAndSortedProducts.map((product) => {
            const stockStatus = getStockStatus(product);
            const isOutOfStock = stockStatus === 'out-of-stock';
            
            return (
              <Card key={product.id} className="group hover-lift border-0 shadow-card bg-card-gradient overflow-hidden cursor-pointer" onClick={() => handleProductClick(product)}>
                <div className="relative overflow-hidden aspect-square">
                  {isHomeFeatured || category === 'all' ? (
                    <ProductImageCarousel
                      images={getProductImages(product)}
                      alt={product.name}
                      className={`w-full h-full ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                      showArrows={true}
                      showDots={true}
                    />
                  ) : (
                    <img
                      src={getProductImage(product.image_url)}
                      alt={product.name}
                      className={`w-full h-full object-cover ${isOutOfStock ? 'opacity-60 grayscale' : ''}`}
                    />
                  )}
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
        )}

        {/* View All Button */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/#shop')}
          >
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