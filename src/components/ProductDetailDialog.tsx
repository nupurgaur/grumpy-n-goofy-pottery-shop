import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Package, 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Plus,
  Minus,
  Info,
  Ruler,
  Palette,
  Shield
} from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { Product } from '@/hooks/useProducts';
import { ProductImageCarousel } from '@/components/ProductImageCarousel';

interface ProductDetailDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

// Fallback images for products
const getProductImage = (imageUrl: string) => {
  if (imageUrl.includes('pottery-mug')) return '/src/assets/pottery-mug.jpg';
  if (imageUrl.includes('pottery-vase')) return '/src/assets/pottery-vase.jpg';
  if (imageUrl.includes('pottery-bowl')) return '/src/assets/pottery-bowl.jpg';
  return imageUrl;
};

export const ProductDetailDialog = ({ product, isOpen, onClose }: ProductDetailDialogProps) => {
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);

  // Reset quantity and image controls when dialog opens
  useEffect(() => {
    if (isOpen && product) {
      setQuantity(1);
      setImageZoom(100);
      setImageRotation(0);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const images = product.images && product.images.length > 0 
    ? product.images.map(img => getProductImage(img))
    : [getProductImage(product.image_url)];

  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity <= product.low_stock_threshold;
  const isInWishlistProduct = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: images[0]
    }, quantity);
    onClose();
  };

  const handleWishlistToggle = async () => {
    if (isInWishlistProduct) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product.id);
    }
  };

  const handleZoomIn = () => {
    setImageZoom(prev => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setImageZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setImageZoom(100);
    setImageRotation(0);
  };

  const handleRotate = () => {
    setImageRotation(prev => (prev + 90) % 360);
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
  };

  // Mock product details (you can extend this with real data)
  const productDetails = {
    dimensions: "8\" H × 6\" W × 4\" D",
    weight: "1.2 lbs",
    material: "Stoneware Clay",
    finish: "Glazed",
    care: "Dishwasher Safe",
    origin: "Handcrafted in USA",
    warranty: "1 Year"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-brand-primary">
            {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            {/* Main Image with Zoom Controls */}
            <div className="relative group">
              <div 
                className="overflow-hidden rounded-lg border"
                style={{
                  transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
                  transformOrigin: 'center',
                  transition: 'transform 0.3s ease'
                }}
              >
                <ProductImageCarousel
                  images={images}
                  alt={product.name}
                  className="w-full h-96"
                  showArrows={true}
                  showDots={true}
                />
              </div>

              {/* Image Controls */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleZoomIn}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleZoomOut}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleRotate}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={handleResetZoom}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom Indicator */}
              <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded">
                {imageZoom}% {imageRotation !== 0 && `• ${imageRotation}°`}
              </div>
            </div>

            {/* Image Gallery Thumbnails */}
            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} - View ${index + 1}`}
                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:border-primary transition-colors"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Details Section */}
          <div className="space-y-6">
            {/* Rating and Reviews */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? "fill-accent-dark text-accent-dark"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.review_count} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-brand-primary">
                  ₹{product.price}
                </span>
                {product.original_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.original_price}
                  </span>
                )}
                {product.original_price && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Save ₹{(product.original_price - product.price).toFixed(2)}
                  </Badge>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Description</h3>
              <p className="text-muted-foreground leading-relaxed">
                {product.description || "This beautiful handcrafted pottery piece brings warmth and character to any space. Made with care and attention to detail, each piece is unique and tells its own story."}
              </p>
            </div>

            {/* Product Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Product Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Dimensions:</span>
                  <span>{productDetails.dimensions}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Weight:</span>
                  <span>{productDetails.weight}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Material:</span>
                  <span>{productDetails.material}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Care:</span>
                  <span>{productDetails.care}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Stock Status */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Availability:</span>
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
            </div>

            {/* Quantity and Actions */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <span className="font-medium">Quantity:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="accent" 
                  size="lg" 
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleWishlistToggle}
                  className={isInWishlistProduct ? 'text-red-500 border-red-500' : ''}
                >
                  <Heart className={`h-5 w-5 ${isInWishlistProduct ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Origin:</span>
                <span>{productDetails.origin}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Warranty:</span>
                <span>{productDetails.warranty}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
