import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { Product } from "@/hooks/useProducts";
import { getProductImages, productDetailPath } from "@/lib/productImages";
import { typography } from "@/config/typography";
import { ProductCatalogLabels } from "@/components/ProductCatalogLabels";

interface RelatedProductsSliderProps {
  products: Product[];
  title?: string;
}

export const RelatedProductsSlider = ({
  products,
  title = "You may also like",
}: RelatedProductsSliderProps) => {
  const navigate = useNavigate();

  if (products.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t">
      <h2 className={`text-2xl lg:text-3xl text-brand-primary mb-8 ${typography.sectionHeader}`}>
        {title}
      </h2>
      <div className="relative px-10">
        <Carousel
          opts={{
            align: "start",
            loop: products.length > 3,
          }}
          className="w-full"
        >
          <CarouselContent>
            {products.map((product) => {
              const images = getProductImages(product);
              return (
                <CarouselItem
                  key={product.id}
                  className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <Card
                    className="overflow-hidden border-0 shadow-card cursor-pointer hover-lift h-full"
                    onClick={() => navigate(productDetailPath(product.id))}
                  >
                    <div className="aspect-square overflow-hidden">
                      <ProductImageCarousel
                        images={images}
                        alt={product.name}
                        className="w-full h-full"
                        showArrows={false}
                        showDots={images.length > 1}
                      />
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className={`text-lg text-brand-primary line-clamp-2 ${typography.heading}`}>
                        {product.name}
                      </h3>
                      <ProductCatalogLabels productName={product.name} compact />
                      <p className={`text-xl text-brand-primary ${typography.heading}`}>
                        ₹{product.price}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(productDetailPath(product.id));
                        }}
                      >
                        View product
                      </Button>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="-left-2 md:-left-4" />
          <CarouselNext className="-right-2 md:-right-4" />
        </Carousel>
      </div>
    </section>
  );
};
