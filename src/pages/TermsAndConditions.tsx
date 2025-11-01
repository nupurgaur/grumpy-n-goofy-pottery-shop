import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const TermsAndConditions = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="text-brand-secondary hover:text-brand-primary px-0">
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-brand-primary mt-2">Terms & Conditions</h1>
        <div className="h-1 w-12 bg-brand-secondary rounded mt-2" />
        <p className="text-sm text-muted-foreground mt-2">Last updated: October 2025</p>
        <Card className="shadow-card mt-6 border-t-4 border-brand-secondary">
          <CardContent className="prose dark:prose-invert max-w-none py-6">
            <p>
              By accessing and using this website, you agree to comply with and be bound by the following terms and conditions of use.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Use of Website</h2>
            <p>
              This website is for your personal and non-commercial use. The content is for your general information and use only. It is subject to change without notice.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Product Information</h2>
            <p>
              We make every effort to display as accurately as possible the colors, features, specifications, and details of the products. However, we do not guarantee that they will be accurate, complete, reliable, current, or free of other errors.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Intellectual Property</h2>
            <p>
              All content on this site, including text, graphics, logos, and images, is our property or the property of our content suppliers and protected by international copyright laws.
            </p>
            
            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Governing Law</h2>
            <p>
             Your use of this website and any dispute arising out of such use is subject to the laws of India.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsAndConditions;
