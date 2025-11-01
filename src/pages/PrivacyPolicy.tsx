import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="text-brand-secondary hover:text-brand-primary px-0">
            <Link to="/">← Back to Home</Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-brand-primary mt-2">Privacy Policy</h1>
        <div className="h-1 w-12 bg-brand-secondary rounded mt-2" />
        <p className="text-sm text-muted-foreground mt-2">Last updated: October 2025</p>
        <Card className="shadow-card mt-6 border-t-4 border-brand-secondary">
          <CardContent className="prose dark:prose-invert max-w-none py-6">
            <p>
              Your privacy is important to us. This policy explains what information we collect, how we use it, and your rights.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Information We Collect</h2>
            <ul>
              <li><strong>Personal Information:</strong> Name, email, shipping address, and phone number when you place an order or create an account.</li>
              <li><strong>Payment Information:</strong> We use secure third-party payment gateways (e.g., Razorpay) and do not store your card details.</li>
              <li><strong>Usage Data:</strong> Information about how you browse our website, collected via cookies and analytics tools.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">How We Use Your Information</h2>
            <ul>
              <li>To process and fulfill your orders.</li>
              <li>To communicate with you about your orders and send occasional marketing updates (you can opt-out anytime).</li>
              <li>To improve our website and customer experience.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information.
            </p>

            <h2 className="text-xl font-semibold mt-6 text-brand-primary">Your Rights</h2>
            <p>
              You have the right to access, update, or delete your personal information. Please contact us at <strong>goofyngrumpy@gmail.com</strong> for any requests.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
