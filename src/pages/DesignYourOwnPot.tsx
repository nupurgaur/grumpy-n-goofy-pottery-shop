import { Navigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PotCustomizer } from "@/components/customizer/PotCustomizer";
import { typography } from "@/config/typography";
import {
  CUSTOM_POT_DELIVERY_ESTIMATE,
  CUSTOM_POT_PREORDERS_OPEN,
} from "@/config/potCustomizer";
import { useDesignYourPotVisible } from "@/hooks/useDesignYourPotVisible";
import { cn } from "@/lib/utils";

const DesignYourOwnPotPage = () => {
  const { visible, loading } = useDesignYourPotVisible();

  if (!loading && !visible) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="max-w-2xl mx-auto text-center space-y-4 mb-10 lg:mb-12">
              <h1
                className={`text-3xl sm:text-4xl lg:text-5xl text-brand-primary ${typography.title}`}
              >
                Design Your Own Pot
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground font-sans leading-relaxed">
                Choose your shape, accessory, colors, and pattern — then add to
                cart to preorder your own custom ceramic piece!
              </p>
              <p className="text-sm sm:text-base text-muted-foreground font-sans leading-relaxed">
                Each pot is made to order, handcrafted in our studio, and takes{" "}
                {CUSTOM_POT_DELIVERY_ESTIMATE} to create before shipping.
              </p>
              <div className="pt-2 space-y-1">
                <p className="text-sm text-muted-foreground font-sans">
                  Currently preorders are:
                </p>
                <p
                  className={cn(
                    "text-lg sm:text-xl font-sans font-semibold",
                    CUSTOM_POT_PREORDERS_OPEN
                      ? "text-brand-secondary"
                      : "text-muted-foreground",
                  )}
                >
                  {CUSTOM_POT_PREORDERS_OPEN ? "open!" : "closed"}
                </p>
              </div>
            </div>

            <PotCustomizer />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DesignYourOwnPotPage;
