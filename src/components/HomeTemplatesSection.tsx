import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TemplateCatalog } from "@/components/TemplateCatalog";
import { useTemplates } from "@/hooks/useTemplates";
import { typography } from "@/config/typography";
import { homeSectionClasses, type HomeSectionTone } from "@/config/homeSections";

type HomeTemplatesSectionProps = {
  sectionTone?: HomeSectionTone;
};

const HomeTemplatesSection = ({ sectionTone = "off-white" }: HomeTemplatesSectionProps) => {
  const { templates, loading } = useTemplates();

  if (loading) {
    return (
      <section className={homeSectionClasses(sectionTone, "scroll-mt-28")}>
        <div className="container mx-auto px-4 w-full">
          <div className="animate-pulse grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-white/40 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (templates.length === 0) return null;

  return (
    <section className={homeSectionClasses(sectionTone, "scroll-mt-28")}>
      <div className="container mx-auto px-4 w-full">
        <div className="text-center mb-12">
          <h2 className={`text-3xl lg:text-4xl text-brand-primary mb-4 ${typography.sectionHeader}`}>
            Pottery Templates
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-sans leading-relaxed">
            Printable PDF guides for slab-building — instant download after purchase.
          </p>
        </div>
        <TemplateCatalog templates={templates.slice(0, 3)} />
        {templates.length > 3 && (
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg">
              <Link to="/templates">View all templates</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeTemplatesSection;
