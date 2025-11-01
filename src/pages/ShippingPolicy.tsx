import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ShippingPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="text-brand-secondary hover:text-brand-primary px-0">
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-brand-primary mt-2">Shipping Policy</h1>
        <div className="h-1 w-12 bg-brand-secondary rounded mt-2" />
        <p className="text-sm text-muted-foreground mt-2">Last updated: October 2025</p>
        <Card className="shadow-card mt-6 border-t-4 border-brand-secondary">
          <CardContent className="prose dark:prose-invert max-w-none py-6">
            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Serviceability</h2>
            <ul>
              <li>We ship across India via trusted courier partners.</li>
              <li>Cash on Delivery (COD) is currently not available.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Dispatch Time</h2>
            <ul>
              <li>Ready items dispatch in 2–4 business days.</li>
              <li>Made‑to‑order items may take 3–4 weeks; timelines are mentioned on product pages.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Delivery Time</h2>
            <ul>
              <li>Typical delivery is 3–7 business days post‑dispatch depending on location.</li>
              <li>Remote locations may take longer due to network constraints.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Shipping Fees</h2>
            <ul>
              <li>Shipping fees (if any) are shown at checkout before payment.</li>
              <li>Free shipping may apply during promotions or above certain order values.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Order Tracking</h2>
            <p>
              You’ll receive tracking details by email/SMS after dispatch. For assistance, write to <strong>goofyngrumpy@gmail.com</strong> with your order ID.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Damages in Transit</h2>
            <p>
              If you receive a damaged item, please email us within 48 hours with unboxing photos/video for a prompt resolution per our Refund & Returns Policy.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">International Shipping</h2>
            <p>
              Currently we ship within India only. For international requests, contact us and we’ll try our best to help.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShippingPolicy;


