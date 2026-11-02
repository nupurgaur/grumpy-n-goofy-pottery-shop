import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { WishlistProvider } from "@/hooks/useWishlist";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import Checkout from "./pages/Checkout";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import ReturnRequest from "./pages/ReturnRequest";
import NotFound from "./pages/NotFound";
import Artist from "./pages/Artist";
import Contact from "./pages/Contact";
import Workshop from "./pages/Workshop";
import Templates from "./pages/Templates";
import Blogs from "./pages/Blogs";
import BlogPost from "./pages/BlogPost";
import RefundPolicy from "./pages/RefundPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import ProductDetail from "./pages/ProductDetail";
import DesignYourOwnPot from "./pages/DesignYourOwnPot";
import { ABOUT_SECTION_ID } from "@/lib/navigateToAbout";

const App = () => {
  console.log('App component is rendering - no React Query should be present');
  return (
  <AuthProvider>
    <CartProvider>
      <WishlistProvider>
        <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollOnNavigate />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products/:productId" element={<ProductDetail />} />
            <Route path="/artist" element={<Artist />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/workshop" element={<Workshop />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blogs/:slug" element={<BlogPost />} />
            <Route path="/design-your-pot" element={<DesignYourOwnPot />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:orderId" element={<OrderDetail />} />
            <Route path="/orders/:orderId/return" element={<ReturnRequest />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/cancellation-policy" element={<CancellationPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </WishlistProvider>
    </CartProvider>
  </AuthProvider>
);
};

export default App;

const ScrollOnNavigate = () => {
  const location = useLocation();

  React.useEffect(() => {
    if (!location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      return;
    }

    const targetId = location.hash.slice(1);
    let attempts = 0;
    const maxAttempts = targetId === ABOUT_SECTION_ID ? 40 : 12;

    const scrollToTarget = () => {
      const el = document.getElementById(targetId);
      if (el) {
        window.requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
      if (attempts < maxAttempts) {
        attempts += 1;
        window.setTimeout(scrollToTarget, targetId === ABOUT_SECTION_ID ? 100 : 50);
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      }
    };

    window.setTimeout(scrollToTarget, 0);
  }, [location.pathname, location.search, location.hash]);

  return null;
};
