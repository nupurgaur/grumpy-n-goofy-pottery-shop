import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CancellationPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="text-brand-secondary hover:text-brand-primary px-0">
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-brand-primary mt-2">Cancellation Policy</h1>
        <div className="h-1 w-12 bg-brand-secondary rounded mt-2" />
        <p className="text-sm text-muted-foreground mt-2">Last updated: October 2025</p>
        <Card className="shadow-card mt-6 border-t-4 border-brand-secondary">
          <CardContent className="prose dark:prose-invert max-w-none py-6">
            <p>
              We understand that plans can change. Here is our policy regarding order cancellations.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Cancellation Window</h2>
            <ul>
              <li>You may cancel your order within 24 hours of placing it for a full refund.</li>
              <li>Cancellations are not possible after the order has been dispatched.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">How to Cancel</h2>
            <p>
              To cancel your order, please email us at <strong>goofyngrumpy@gmail.com</strong> with your order ID and reason for cancellation.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Refund for Cancellation</h2>
            <p>
             If your cancellation is approved, the refund will be processed to your original payment method within 5-7 business days.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CancellationPolicy;
