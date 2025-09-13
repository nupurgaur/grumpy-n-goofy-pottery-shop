import Checkout from '@/components/Checkout';

const CheckoutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-brand-primary mb-8">Checkout</h1>
          <Checkout />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;