import { Button } from "@/components/ui/button";
import { typography } from "@/config/typography";
import { CUSTOM_POT_PRICE } from "@/config/potCustomizer";
import { Link } from "react-router-dom";
import { Paintbrush, Sparkles } from "lucide-react";
import { homeSectionClasses, type HomeSectionTone } from "@/config/homeSections";

const DesignYourPotPromo = ({ sectionTone = "light-blue" }: { sectionTone?: HomeSectionTone }) => (
  <section className={homeSectionClasses(sectionTone, "w-full scroll-mt-28")}>
    <div className="container mx-auto px-4 sm:px-6 w-full">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-primary/15 bg-white/60 px-3 py-1 text-xs font-sans text-brand-primary">
            <Sparkles className="h-3.5 w-3.5 text-brand-primary" />
            Made to order
          </div>
          <h2
            className={`text-2xl sm:text-3xl lg:text-4xl text-brand-primary leading-tight ${typography.title}`}
          >
            Design Your Own Pot
          </h2>
          <p className="text-muted-foreground font-sans leading-relaxed max-w-xl">
            Pick your shape, pattern, accessory, and colours — then preorder a
            ceramic piece that&apos;s uniquely yours. A playful way to bring
            your personality into everyday rituals, from morning mugs to
            keepsake jars.
          </p>
          <p className="text-sm text-muted-foreground font-sans">
            From ₹{CUSTOM_POT_PRICE.toLocaleString("en-IN")} · Handcrafted in
            our studio
          </p>
          <Button asChild variant="quirky" size="lg">
            <Link to="/design-your-pot">Start Designing</Link>
          </Button>
        </div>

        <div className="flex items-center justify-center md:justify-end">
          <div className="relative flex h-48 w-48 sm:h-56 sm:w-56 items-center justify-center rounded-full border-2 border-white/70 bg-[#FAF6F0]/90 shadow-card">
            <Paintbrush
              className="h-16 w-16 sm:h-20 sm:w-20 text-brand-primary/60"
              strokeWidth={1.25}
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default DesignYourPotPromo;
