import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Product } from "@/hooks/useProducts";
import {
  TEMPLATE_BENEFITS,
  TEMPLATE_DESCRIPTION,
  TEMPLATE_HOW_TO_USE,
  TEMPLATE_PERFECT_FOR,
} from "@/config/templates";
import { typography } from "@/config/typography";

interface TemplateProductDetailsProps {
  product: Product;
}

export const TemplateProductDetails = ({ product }: TemplateProductDetailsProps) => {
  return (
    <Accordion type="single" collapsible defaultValue="about" className="w-full">
      <AccordionItem value="about">
        <AccordionTrigger className={`text-left text-lg text-brand-primary ${typography.subheading}`}>
          About this template
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground space-y-5 pb-4">
          {product.description && (
            <p className="leading-relaxed">{product.description}</p>
          )}
          <div className="space-y-2">
            {TEMPLATE_DESCRIPTION.map((line) => (
              <p key={line} className="text-sm leading-relaxed">
                {line}
              </p>
            ))}
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Perfect for</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
              {TEMPLATE_PERFECT_FOR.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-foreground mb-2">Why makers love it</p>
            <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
              {TEMPLATE_BENEFITS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="how-to-use">
        <AccordionTrigger className={`text-left text-lg text-brand-primary ${typography.subheading}`}>
          How to use
        </AccordionTrigger>
        <AccordionContent className="text-muted-foreground pb-4">
          <ol className="list-decimal pl-5 space-y-2.5 leading-relaxed text-sm">
            {TEMPLATE_HOW_TO_USE.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="text-sm mt-4 text-muted-foreground/90">
            Your PDF download link is emailed immediately after payment — no shipping required.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
