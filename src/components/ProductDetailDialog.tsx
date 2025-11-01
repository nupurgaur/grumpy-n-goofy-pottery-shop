import { useState, useEffect, useRef, useCallback } from 'react';
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
  RefreshCw,
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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const imagePositionRef = useRef({ x: 0, y: 0 });
  const imageContainerRef = useRef<HTMLDivElement>(null);
  
  // Keep refs in sync with state
  useEffect(() => {
    imagePositionRef.current = imagePosition;
  }, [imagePosition]);

  // Reset quantity and image controls when dialog opens
  useEffect(() => {
    const resetPos = { x: 0, y: 0 };
    if (isOpen && product) {
      setQuantity(1);
      setImageZoom(100);
      setImageRotation(0);
      setCurrentImageIndex(0);
      setImagePosition(resetPos);
      imagePositionRef.current = resetPos;
      setIsDragging(false);
    } else if (!isOpen) {
      // Also reset when dialog closes
      setImageZoom(100);
      setImageRotation(0);
      setImagePosition(resetPos);
      imagePositionRef.current = resetPos;
      setIsDragging(false);
    }
  }, [isOpen, product]);

  // Constrain position when zoom changes
  useEffect(() => {
    if (imageZoom <= 100) {
      const resetPos = { x: 0, y: 0 };
      setImagePosition(resetPos);
      imagePositionRef.current = resetPos;
    } else if (imageContainerRef.current) {
      const container = imageContainerRef.current;
      const containerWidth = container.offsetWidth;
      const containerHeight = container.offsetHeight;
      const scaledWidth = containerWidth * (imageZoom / 100);
      const scaledHeight = containerHeight * (imageZoom / 100);
      const maxX = (scaledWidth - containerWidth) / 2;
      const maxY = (scaledHeight - containerHeight) / 2;
      
      setImagePosition(prev => {
        const constrained = {
          x: Math.max(-maxX, Math.min(maxX, prev.x)),
          y: Math.max(-maxY, Math.min(maxY, prev.y))
        };
        imagePositionRef.current = constrained;
        return constrained;
      });
    }
  }, [imageZoom]);

  // Global mouse move handler - must be before early return
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || imageZoom <= 100 || !imageContainerRef.current) return;
      
      e.preventDefault();
      
      const container = imageContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // Calculate new position relative to where mouse was when drag started
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      
      // Calculate bounds to prevent dragging too far
      const scale = imageZoom / 100;
      const scaledWidth = containerWidth * scale;
      const scaledHeight = containerHeight * scale;
      const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
      const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);
      
      const constrainedX = Math.max(-maxX, Math.min(maxX, newX));
      const constrainedY = Math.max(-maxY, Math.min(maxY, newY));
      
      setImagePosition({
        x: constrainedX,
        y: constrainedY
      });
    };

    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, imageZoom]);

  // Early return after all hooks
  if (!product) return null;

  // Handler functions that use product - these come after early return
  const imagesArray = (() => {
    const imgs = product.images && product.images.length > 0 
      ? product.images.map(img => getProductImage(img))
      : [getProductImage(product.image_url || '')];
    
    const filtered = imgs.filter(img => img);
    return filtered.length > 0 ? filtered : ['/src/assets/pottery-bowl.jpg'];
  })();

  const isOutOfStock = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity <= product.low_stock_threshold;
  const isInWishlistProduct = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: imagesArray[0]
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
    const resetPos = { x: 0, y: 0 };
    setImagePosition(resetPos);
    imagePositionRef.current = resetPos;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (imageZoom > 100) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX - imagePositionRef.current.x,
        y: e.clientY - imagePositionRef.current.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // This is handled by global listener now, but keep for touch compatibility
    if (isDragging && imageZoom > 100) {
      e.preventDefault();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    // Don't stop dragging on mouse leave - let global handlers manage it
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (imageZoom > 100 && e.touches.length === 1) {
      e.preventDefault();
      setIsDragging(true);
      const touch = e.touches[0];
      dragStartRef.current = {
        x: touch.clientX - imagePositionRef.current.x,
        y: touch.clientY - imagePositionRef.current.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || imageZoom <= 100 || e.touches.length !== 1 || !imageContainerRef.current) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    
    const container = imageContainerRef.current;
    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    
    const newX = touch.clientX - dragStartRef.current.x;
    const newY = touch.clientY - dragStartRef.current.y;
    
    const scale = imageZoom / 100;
    const scaledWidth = containerWidth * scale;
    const scaledHeight = containerHeight * scale;
    const maxX = Math.max(0, (scaledWidth - containerWidth) / 2);
    const maxY = Math.max(0, (scaledHeight - containerHeight) / 2);
    
    const constrainedX = Math.max(-maxX, Math.min(maxX, newX));
    const constrainedY = Math.max(-maxY, Math.min(maxY, newY));
    
    setImagePosition({
      x: constrainedX,
      y: constrainedY
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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

  // Get details from product props, fallback if missing
  const details = {
    dimensions: product.dimensions || "",
    weight: product.weight || "",
    care: product.care || "Microwave safe",
    origin: product.origin || "Handcrafted in India",
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
            <div 
              ref={imageContainerRef}
              className={`relative group h-96 overflow-hidden rounded-lg border ${
                imageZoom > 100 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${Math.max(0.5, Math.min(3, imageZoom / 100))}) rotate(${imageRotation}deg)`,
                  transformOrigin: 'center',
                  transition: isDragging ? 'none' : 'transform 0.3s ease'
                }}
              >
                <ProductImageCarousel
                  images={imagesArray}
                  alt={product.name}
                  className="w-full h-full"
                  showArrows={true}
                  showDots={true}
                  currentIndex={currentImageIndex}
                  onIndexChange={setCurrentImageIndex}
                />
              </div>

              {/* Image Controls */}
              <div 
                className="absolute top-4 right-4 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRotate();
                  }}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetZoom();
                  }}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {/* Zoom Indicator */}
              <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm text-xs px-2 py-1 rounded">
                {imageZoom}% {imageRotation !== 0 && `• ${imageRotation}°`}
              </div>
            </div>

            {/* Image Gallery Thumbnails */}
            {imagesArray.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {imagesArray.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${product.name} - View ${index + 1}`}
                    className={`w-16 h-16 object-cover rounded border cursor-pointer hover:border-primary transition-colors ${
                      index === currentImageIndex ? 'border-primary ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
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
                {details.dimensions && (
                  <div className="flex items-center space-x-2">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Dimensions:</span>
                    <span>{details.dimensions}</span>
                  </div>
                )}
                {details.weight && (
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Weight:</span>
                    <span>{details.weight}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Material:</span>
                  <span>Stoneware Clay</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Care:</span>
                  <span>{details.care}</span>
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
                <span>{details.origin}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
