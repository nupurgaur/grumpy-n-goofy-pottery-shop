import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";
import { Product } from "@/hooks/useProducts";
import { getProductImages, productDetailPath } from "@/lib/productImages";
import { typography } from "@/config/typography";
import { ProductDescription } from "@/components/ProductDescription";
import { FileDown } from "lucide-react";

interface TemplateCatalogProps {
  templates: Product[];
}

export const TemplateCatalog = ({ templates }: TemplateCatalogProps) => {
  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-sans italic">
        New templates are on the way — check back soon for downloadable guides.
      </p>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {templates.map((template) => {
        const images = getProductImages(template);

        return (
          <Card
            key={template.id}
            className="group hover-lift border-0 shadow-card bg-card-gradient overflow-hidden"
          >
            <Link to={productDetailPath(template.id)} className="block">
              <div className="relative overflow-hidden aspect-square">
                <ProductImageCarousel
                  images={images}
                  alt={template.name}
                  className="w-full h-full"
                />
                <Badge className="absolute top-4 right-4 bg-brand-secondary/95 text-white border-0">
                  <FileDown className="h-3 w-3 mr-1" />
                  Instant PDF
                </Badge>
              </div>
            </Link>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Link to={productDetailPath(template.id)}>
                  <h3 className={`text-xl text-brand-primary hover:text-brand-secondary transition-colors ${typography.heading}`}>
                    {template.name}
                  </h3>
                </Link>
                {template.description && (
                  <ProductDescription text={template.description} compact />
                )}
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-2xl text-brand-primary ${typography.heading}`}>
                    ₹{template.price}
                  </span>
                  {template.original_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{template.original_price}
                    </span>
                  )}
                </div>
                <Button asChild variant="accent" size="sm">
                  <Link to={productDetailPath(template.id)}>View template</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
