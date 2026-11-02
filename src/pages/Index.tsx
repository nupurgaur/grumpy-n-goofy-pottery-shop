import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import HomeTemplatesSection from "@/components/HomeTemplatesSection";
import HomeWorkshopsSection from "@/components/HomeWorkshopsSection";
import DesignYourPotPromo from "@/components/DesignYourPotPromo";
import About from "@/components/About";
import Footer from "@/components/Footer";
import { useLocation } from "react-router-dom";
import { useTemplates } from "@/hooks/useTemplates";
import { useDesignYourPotVisible } from "@/hooks/useDesignYourPotVisible";

const Index = () => {
  const location = useLocation();
  const hasCategoryParam = location.search.includes('category=');
  const { templates, loading: templatesLoading } = useTemplates();
  const { visible: designPotVisible } = useDesignYourPotVisible();
  const hasTemplates = !templatesLoading && templates.length > 0;
  const isHome = !hasCategoryParam;

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      <Header />
      <main>
        {isHome && <Hero sectionTone="off-white" />}
        {isHome && <HomeWorkshopsSection sectionTone="light-blue" />}
        <FeaturedProducts sectionTone={isHome ? "off-white" : undefined} />
        {isHome && hasTemplates && (
          <HomeTemplatesSection sectionTone="light-blue" />
        )}
        {isHome && designPotVisible && (
          <DesignYourPotPromo sectionTone={hasTemplates ? "off-white" : "light-blue"} />
        )}
        {isHome && (
          <About
            sectionTone={
              hasTemplates
                ? designPotVisible
                  ? "light-blue"
                  : "off-white"
                : designPotVisible
                  ? "off-white"
                  : "light-blue"
            }
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
