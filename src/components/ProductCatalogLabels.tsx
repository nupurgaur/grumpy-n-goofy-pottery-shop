import { Badge } from "@/components/ui/badge";
import { getProductCatalogMeta } from "@/config/productCatalog";
import { cn } from "@/lib/utils";

interface ProductCatalogLabelsProps {
  productName: string;
  className?: string;
  /** Compact layout for product grid cards */
  compact?: boolean;
}

export const ProductCatalogLabels = ({
  productName,
  className,
  compact = false,
}: ProductCatalogLabelsProps) => {
  const meta = getProductCatalogMeta(productName);
  if (!meta) return null;

  const labels = [meta.pieceType, ...meta.adjectives];

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {labels.map((label) => (
        <Badge
          key={label}
          variant="outline"
          className={cn(
            "font-normal border-brand-secondary/30 text-brand-primary bg-background/60",
            compact ? "text-xs px-2 py-0" : "text-xs",
          )}
        >
          {label}
        </Badge>
      ))}
    </div>
  );
};
