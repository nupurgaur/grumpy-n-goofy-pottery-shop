import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { ProductDetailsAccordion } from "@/components/ProductDetailsAccordion";
import { RelatedProductsSlider } from "@/components/RelatedProductsSlider";
import { useProduct } from "@/hooks/useProduct";
import { useCart } from "@/hooks/useCart";
import { useWishlist } from "@/hooks/useWishlist";
import { getProductImages } from "@/lib/productImages";
import { typography } from "@/config/typography";
import { ProductCatalogLabels } from "@/components/ProductCatalogLabels";
import {
  ArrowLeft,
  Heart,
  Minus,
  Package,
  Plus,
  ShoppingCart,
} from "lucide-react";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { product, relatedProducts, loading, error } = useProduct(productId);
  const { addItem } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="animate-pulse max-w-6xl mx-auto grid md:grid-cols-2 gap-12">
            <div className="aspect-square bg-muted rounded-lg" />
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded w-3/4" />
              <div className="h-6 bg-muted rounded w-1/4" />
              <div className="h-24 bg-muted rounded" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className={`text-2xl text-brand-primary mb-4 ${typography.heading}`}>
            Product not found
          </h1>
          <p className="text-muted-foreground mb-6">{error || "This item may no longer be available."}</p>
          <Button asChild variant="accent">
            <Link to="/">Back to shop</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const images = getProductImages(product);
  const isOutOfStock = product.stock_quantity === 0;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: images[0],
      },
      quantity,
    );
  };

  const handleQuantityChange = (change: number) => {
    const next = quantity + change;
    if (next >= 1 && next <= product.stock_quantity) {
      setQuantity(next);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <Button
          variant="ghost"
          className="mb-6 text-brand-secondary hover:text-brand-primary px-0"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
            <div className="space-y-4">
              <div className="aspect-square overflow-hidden rounded-lg border bg-card">
                <ProductImageCarousel
                  images={images}
                  alt={product.name}
                  className="w-full h-full"
                  showArrows
                  showDots
                  currentIndex={currentImageIndex}
                  onIndexChange={setCurrentImageIndex}
                />
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={`shrink-0 w-16 h-16 rounded border overflow-hidden transition-colors ${
                        index === currentImageIndex
                          ? "border-primary ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h1 className={`text-3xl lg:text-4xl text-brand-primary leading-tight ${typography.title}`}>
                {product.name}
              </h1>

              <ProductCatalogLabels productName={product.name} />

              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <span className={`text-3xl text-brand-primary ${typography.heading}`}>
                  ₹{product.price}
                </span>
                {product.original_price && (
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{product.original_price}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span
                  className={
                    isOutOfStock
                      ? "text-destructive font-medium"
                      : product.stock_quantity <= product.low_stock_threshold
                        ? "text-yellow-600"
                        : "text-green-600"
                  }
                >
                  {isOutOfStock
                    ? "Out of stock"
                    : product.stock_quantity <= product.low_stock_threshold
                      ? `Low stock — ${product.stock_quantity} left`
                      : `${product.stock_quantity} in stock`}
                </span>
              </div>

              <Separator />

              <div className="flex items-center gap-4">
                <span className="font-medium">Quantity</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-10 text-center font-medium">{quantity}</span>
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

              <div className="flex gap-3">
                <Button
                  variant="accent"
                  size="lg"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isOutOfStock ? "Out of stock" : "Add to cart"}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() =>
                    inWishlist ? removeFromWishlist(product.id) : addToWishlist(product.id)
                  }
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              </div>

              <ProductDetailsAccordion product={product} />
            </div>
          </div>

          <RelatedProductsSlider products={relatedProducts} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
