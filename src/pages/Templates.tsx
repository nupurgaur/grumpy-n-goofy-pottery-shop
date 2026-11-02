import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TemplateCatalog } from "@/components/TemplateCatalog";
import { useTemplates } from "@/hooks/useTemplates";
import { BRAND_NAME } from "@/config/brand";
import { typography } from "@/config/typography";
import { LayoutGrid, Paintbrush, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const TemplatesPage = () => {
  const { templates, loading } = useTemplates();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
            <div className="space-y-6 mb-14">
              <h1
                className={`text-4xl lg:text-5xl leading-tight ${typography.title}`}
              >
                <span className="text-brand-secondary">Pottery</span>{" "}
                <span className="text-brand-primary">Templates &amp; Guides</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl font-sans leading-relaxed">
                Printable PDF templates from {BRAND_NAME} — instant download after
                purchase. Follow the pattern, build with clay, and make something
                uniquely yours.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-14">
              <Card className="shadow-card border border-border/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <LayoutGrid className="h-5 w-5 text-brand-secondary shrink-0" />
                  <div>
                    <h3 className={`text-brand-primary ${typography.heading}`}>
                      Form Templates
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans">
                      Printable patterns with clear measurements for slab-building.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card border border-border/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <Paintbrush className="h-5 w-5 text-brand-secondary shrink-0" />
                  <div>
                    <h3 className={`text-brand-primary ${typography.heading}`}>
                      Beginner Friendly
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans">
                      Designed to save time on proportions and help you build with confidence.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card border border-border/50">
                <CardContent className="p-5 flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-brand-secondary shrink-0" />
                  <div>
                    <h3 className={`text-brand-primary ${typography.heading}`}>
                      Instant Download
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans">
                      Your PDF arrives by email right after checkout — no shipping needed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {loading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse rounded-lg border overflow-hidden">
                    <div className="aspect-square bg-muted" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                      <div className="h-8 bg-muted rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <TemplateCatalog templates={templates} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TemplatesPage;
