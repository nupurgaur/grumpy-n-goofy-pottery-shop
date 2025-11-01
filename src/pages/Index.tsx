import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import About from "@/components/About";
import Footer from "@/components/Footer";
import { useLocation } from "react-router-dom";

const Index = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const hasCategoryParam = location.search.includes('category=');
  const category = params.get('category') || 'all';
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {!hasCategoryParam && <Hero />}
        <FeaturedProducts />
        {!hasCategoryParam && <About />}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
