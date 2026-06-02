import Checkout from '@/components/Checkout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { typography } from '@/config/typography';

const CheckoutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button asChild variant="ghost" className="text-brand-secondary hover:text-brand-primary px-0">
              <Link to="/">← Back to Home</Link>
            </Button>
          </div>
          <h1 className={`text-3xl text-brand-primary mb-8 ${typography.title}`}>Checkout</h1>
          <Checkout />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;