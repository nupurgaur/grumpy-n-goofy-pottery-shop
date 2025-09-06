import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/pottery-hero.jpg";

const Hero = () => {
  return (
    <section id="home" className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 hero-gradient opacity-10"></div>
      
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Content */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-brand-secondary">
              <Sparkles className="h-5 w-5" />
              <span className="text-sm font-medium">Handcrafted with Love</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              <span className="text-brand-primary">Quirky</span> Pottery for{" "}
              <span className="text-brand-secondary">Everyday</span> Magic
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg">
              Where grumpy meets goofy! Discover unique, handcrafted pottery pieces 
              that bring character and charm to your daily rituals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="quirky" size="lg" className="group">
              Shop Collection
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg">
              Our Story
            </Button>
          </div>

          {/* Stats */}
          <div className="flex space-x-8 pt-4">
            <div>
              <div className="text-2xl font-bold text-brand-primary">500+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Pieces Crafted</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-primary">5★</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl shadow-quirky hover:scale-105 transition-smooth">
            <img
              src={heroImage}
              alt="Beautiful handcrafted pottery collection"
              className="w-full h-[500px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
          </div>
          
          {/* Floating elements */}
          <div className="absolute -top-4 -right-4 bg-secondary text-secondary-foreground rounded-full p-3 shadow-quirky animate-bounce">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;