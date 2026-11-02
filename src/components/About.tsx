import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Palette, Users, Heart, LayoutGrid } from "lucide-react";
import { typography } from "@/config/typography";
import { homeSectionClasses, type HomeSectionTone } from "@/config/homeSections";

const features = [
  {
    icon: Palette,
    title: "Creative Workshops",
    description:
      "Beginner-friendly pottery experiences designed to make clay approachable, playful, and enjoyable.",
  },
  {
    icon: Heart,
    title: "Expressive Ceramics",
    description:
      "Collectible handmade pieces with personality, designed for everyday rituals and meaningful spaces.",
  },
  {
    icon: Users,
    title: "Community & Connection",
    description:
      "Building a growing community of curious makers, collectors, and people discovering clay for the first time.",
  },
  {
    icon: LayoutGrid,
    title: "Handbuilding Templates",
    description:
      "Thoughtfully designed templates that simplify slab-building and make complex pottery forms feel approachable and achievable.",
  },
];

const About = ({ sectionTone = "off-white" }: { sectionTone?: HomeSectionTone }) => {
  const navigate = useNavigate();
  return (
    <section id="about" className={homeSectionClasses(sectionTone, "scroll-mt-28")}>
      <div className="container mx-auto px-4 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <h2
                className={`text-3xl lg:text-4xl text-brand-primary mb-6 leading-tight ${typography.title}`}
              >
                More Than a Pottery Studio.
              </h2>
              <div className="space-y-4 text-muted-foreground font-sans leading-relaxed">
                <p>
                  Goofy n Grumpy began with a simple belief:{" "}
                  <em className="italic text-muted-foreground">
                    pottery should feel welcoming, playful, and accessible to
                    everyone
                  </em>
                  .
                </p>
                <p>
                  As a software engineer who fell in love with clay, I discovered
                  that creativity isn&apos;t reserved for artists or people from
                  creative professions. Sometimes all it takes is curiosity and the
                  willingness to try something new.
                </p>
                <p>
                  What started as a personal journey with pottery has grown into a
                  creative space where people can collect expressive ceramics, learn
                  through hands-on workshops, and experience the joy of making
                  something with their own hands.
                </p>
                <p>
                  Whether you&apos;re here to discover a piece that resonates with
                  you, try the pottery wheel for the first time, or simply slow down
                  and create, you&apos;re part of the story we&apos;re building.
                </p>
                <p>
                  Our vision is to introduce more people to clay, one piece, one
                  workshop, and one curious beginner at a time.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="quirky" size="lg" onClick={() => navigate("/artist")}>
                Our Story
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/contact")}>
                Contact Us
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-0 shadow-card bg-card-gradient hover-lift h-full"
              >
                <CardContent className="p-6 flex flex-col h-full space-y-4">
                  <div className="w-14 h-14 bg-secondary/20 rounded-full flex items-center justify-center shrink-0">
                    <feature.icon className="h-7 w-7 text-brand-secondary" />
                  </div>
                  <h3
                    className={`text-lg text-brand-primary leading-snug ${typography.heading}`}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground font-sans leading-relaxed flex-1">
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
