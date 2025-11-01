import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const RefundPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="text-brand-secondary hover:text-brand-primary px-0">
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-brand-primary mt-2">Refund & Returns Policy</h1>
        <div className="h-1 w-12 bg-brand-secondary rounded mt-2" />
        <p className="text-sm text-muted-foreground mt-2">Last updated: October 2025</p>
        <Card className="shadow-card mt-6 border-t-4 border-brand-secondary">
          <CardContent className="prose dark:prose-invert max-w-none py-6">
            <p>
              We craft every piece with care. As a small-batch studio in India, we follow a fair and transparent policy for refunds and returns in line with standard Indian e‑commerce practices.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Returns Eligibility</h2>
            <ul>
              <li>Returns are accepted only for items that are damaged, defective, or incorrect on delivery.</li>
              <li>Initiate a return within 48 hours of delivery with unboxing photos/video showing the issue.</li>
              <li>Items must be unused and in original packaging.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Non‑returnable Items</h2>
            <ul>
              <li>Used items or items without original packaging.</li>
              <li>Minor glaze/shape variations typical of handcrafted ceramics.</li>
              <li>Gift cards and custom/personalised orders.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Refunds</h2>
            <ul>
              <li>After inspection, approved refunds are processed to the original payment method within 5–7 business days.</li>
              <li>Shipping charges are non‑refundable except for damaged/incorrect items.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Replacements</h2>
            <p>
              Wherever possible, we offer a replacement of the same item. If unavailable, you may choose a refund or store credit.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">How to Raise a Return</h2>
            <ol>
              <li>Email us at <strong>goofyngrumpy@gmail.com</strong> within 48 hours of delivery.</li>
              <li>Attach order ID, photos/video of the package and product, and a brief description.</li>
              <li>We’ll arrange return pickup where serviceable, or share return instructions.</li>
            </ol>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Contact</h2>
            <p>
              For any questions, write to <strong>goofyngrumpy@gmail.com</strong>. We’re happy to help.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RefundPolicy;


