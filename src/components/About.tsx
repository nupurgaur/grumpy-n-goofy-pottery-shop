import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Coffee, Palette, Users } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Made with Love",
    description: "Every piece is handcrafted with care and attention to detail",
  },
  {
    icon: Coffee,
    title: "Daily Rituals",
    description: "Designed to make your everyday moments more special",
  },
  {
    icon: Palette,
    title: "Unique Designs",
    description: "Each piece has its own personality - just like you!",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Supporting local artisans and sustainable practices",
  },
];

const About = () => {
  const navigate = useNavigate();
  return (
    <section id="about" className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-brand-primary mb-6">
                Where Goofy Meets Grumpy
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p className="text-lg">
                  Started in a tiny studio with clay-covered hands and a big dream, 
                  Goofy 'n' Grumpy brings you pottery that's anything but ordinary.
                </p>
                <p>
                  We believe that functional art should make you smile - whether you're 
                  a grumpy morning person reaching for your coffee mug or a goofy soul 
                  who finds joy in the little things.
                </p>
                <p>
                  Each piece is lovingly shaped, fired, and finished by hand, carrying 
                  with it the imperfections that make it perfectly unique.
                </p>
              </div>
            </div>

            <Button variant="quirky" size="lg" onClick={() => navigate('/artist')}>
              Meet the Artist
            </Button>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-card bg-card-gradient hover-lift">
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center">
                    <feature.icon className="h-8 w-8 text-brand-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold text-brand-primary">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;