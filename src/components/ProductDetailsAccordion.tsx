import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Product } from "@/hooks/useProducts";
import { DEFAULT_HOW_TO_USE, DEFAULT_SHIPPING_DETAILS } from "@/config/productDetails";
import { typography } from "@/config/typography";

interface ProductDetailsAccordionProps {
  product: Product;
}

export const ProductDetailsAccordion = ({ product }: ProductDetailsAccordionProps) => {
  const specRows = [
    product.dimensions && { label: "Dimensions", value: product.dimensions },
    product.weight && { label: "Weight", value: product.weight },
    product.origin && { label: "Origin", value: product.origin },
  ].filter(Boolean) as { label: string; value: string }[];

  const careLines = product.care
    ? product.care.includes("\n")
      ? product.care.split("\n").map((s) => s.trim()).filter(Boolean)
      : [product.care]
    : DEFAULT_HOW_TO_USE;

  return (
    <Accordion type="single" collapsible defaultValue="details" className="w-full">
      <AccordionItem value="details">
        <AccordionTrigger className={`text-left text-lg text-brand-primary ${typography.subheading}`}>
          Product details
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground pb-4">
          {specRows.length > 0 ? (
            <dl className="grid sm:grid-cols-2 gap-3 text-sm">
              {specRows.map(({ label, value }) => (
                <div key={label}>
                  <dt className="font-medium text-foreground">{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm">Dimensions and weight will be added soon.</p>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="how-to-use">
        <AccordionTrigger className={`text-left text-lg text-brand-primary ${typography.subheading}`}>
          How to use &amp; care
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground pb-4">
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            {careLines.map((line, index) => (
              <li key={index}>{line.endsWith(".") ? line : `${line}.`}</li>
            ))}
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="shipping">
        <AccordionTrigger className={`text-left text-lg text-brand-primary ${typography.subheading}`}>
          Shipping details
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-4 pb-4">
          <ul className="list-disc pl-5 space-y-2 leading-relaxed">
            {DEFAULT_SHIPPING_DETAILS.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
          <p className="text-sm">
            <Link to="/shipping-policy" className="text-brand-secondary underline-offset-4 hover:underline">
              Read full shipping policy
            </Link>
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
