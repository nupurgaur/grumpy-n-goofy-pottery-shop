import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart, Heart, Star } from "lucide-react";
import mugImage from "@/assets/pottery-mug.jpg";
import vaseImage from "@/assets/pottery-vase.jpg";
import bowlImage from "@/assets/pottery-bowl.jpg";

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  description: string;
  isFeatured?: boolean;
}

const products: Product[] = [
  {
    id: 1,
    name: "Grumpy Morning Mug",
    price: 28,
    originalPrice: 35,
    image: mugImage,
    rating: 4.8,
    reviews: 124,
    description: "Perfect for those who need coffee before conversation",
    isFeatured: true,
  },
  {
    id: 2,
    name: "Goofy Garden Vase",
    price: 45,
    image: vaseImage,
    rating: 4.9,
    reviews: 89,
    description: "Brings joy to any space with its playful curves",
  },
  {
    id: 3,
    name: "Happy Meal Bowl",
    price: 32,
    image: bowlImage,
    rating: 4.7,
    reviews: 156,
    description: "Makes every meal feel like a celebration",
  },
];

const FeaturedProducts = () => {
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
          {products.map((product) => (
            <Card key={product.id} className="group hover-lift border-0 shadow-card bg-card-gradient overflow-hidden">
              <div className="relative overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-smooth"
                />
                {product.isFeatured && (
                  <div className="absolute top-4 left-4 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Featured
                  </div>
                )}
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
                      {product.rating} ({product.reviews})
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

                  {/* Price and Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-brand-primary">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>
                    <Button variant="accent" size="sm" className="group">
                      <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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