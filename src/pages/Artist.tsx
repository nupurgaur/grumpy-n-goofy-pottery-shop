import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Twitter, Camera, Sparkles } from "lucide-react";

const ArtistPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-6">
                <h1 className="text-3xl lg:text-4xl font-bold text-brand-primary">Meet the Artist</h1>
                <p className="text-muted-foreground text-lg">
                  Hi, I’m the hands behind Goofy 'n' Grumpy. Every mug, bowl, and vase
                  is hand-thrown in small batches, designed to bring a little joy to your
                  everyday rituals. Expect quirky shapes, cozy glazes, and one-of-a-kind
                  personality in each piece.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="shadow-card">
                    <CardContent className="p-5 flex items-start gap-3">
                      <Sparkles className="h-5 w-5 text-brand-secondary" />
                      <div>
                        <h3 className="font-semibold text-brand-primary">Small-Batch Craft</h3>
                        <p className="text-sm text-muted-foreground">Limited runs with intentional imperfections.</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="shadow-card">
                    <CardContent className="p-5 flex items-start gap-3">
                      <Camera className="h-5 w-5 text-brand-secondary" />
                      <div>
                        <h3 className="font-semibold text-brand-primary">Studio Stories</h3>
                        <p className="text-sm text-muted-foreground">Follow along for process, drops, and restocks.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="accent" onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}>
                    Get in Touch
                  </Button>
                  <div className="flex items-center gap-2">
                    {[Instagram, Facebook, Twitter].map((Icon, i) => (
                      <Button key={i} variant="outline" size="icon">
                        <Icon className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <Card className="overflow-hidden shadow-card border-0">
                  <img
                    src="/lovable-uploads/5a8d33c9-9b0f-47f7-8ff5-f04b4eb1ceb5.png"
                    alt="Goofy 'n' Grumpy Studio"
                    className="w-full h-full object-contain bg-muted/20"
                  />
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ArtistPage;


