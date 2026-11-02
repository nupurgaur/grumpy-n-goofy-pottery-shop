import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HERO_CAROUSEL_IMAGES } from "@/config/heroCarousel";
import { BRAND_NAME } from "@/config/brand";
import { typography } from "@/config/typography";
import { ProductImageCarousel } from "@/components/ProductImageCarousel";

const Hero = () => {
  // Subtle repeating mugs and vases checker pattern (SVG) for background
  const vasePatternSvg = encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='rgba(0,0,0,0.08)'/>
          <stop offset='100%' stop-color='rgba(0,0,0,0.04)'/>
        </linearGradient>
      </defs>
      <rect width='96' height='96' fill='none'/>
      <!-- Top-left: Mug -->
      <g transform='translate(8,8)'>
        <rect x='4' y='8' width='20' height='22' rx='3' ry='3' fill='url(#g)'/>
        <circle cx='30' cy='20' r='6' fill='none' stroke='rgba(0,0,0,0.08)' stroke-width='3'/>
      </g>
      <!-- Top-right: Vase -->
      <g transform='translate(56,6)'>
        <path d='M24 6c-2 0-3 1.5-3 3 0 1.5.5 2.5 1.5 3.5-1 .8-2 1.9-2.6 3.4-.7 1.7-.7 3.7.2 5.3l2.2 4c.4.7.6 1.5.6 2.3v5.5c0 1.1-.6 2.1-1.6 2.6l-1 .5c-.7.4-.5 1.4.3 1.6 2.9.7 6 .8 9 .4 1-.1 1.2-1.3.4-1.7l-1-.5c-1-.5-1.6-1.5-1.6-2.6v-5.3c0-.9.2-1.7.6-2.4l2.1-3.9c.9-1.6 1-3.6.3-5.3-.6-1.5-1.6-2.6-2.6-3.4 1-1 1.5-2 1.5-3.5 0-1.5-1-3-3-3h-2z' fill='url(#g)'/>
      </g>
      <!-- Bottom-left: Vase -->
      <g transform='translate(6,56)'>
        <path d='M24 6c-2 0-3 1.5-3 3 0 1.5.5 2.5 1.5 3.5-1 .8-2 1.9-2.6 3.4-.7 1.7-.7 3.7.2 5.3l2.2 4c.4.7.6 1.5.6 2.3v5.5c0 1.1-.6 2.1-1.6 2.6l-1 .5c-.7.4-.5 1.4.3 1.6 2.9.7 6 .8 9 .4 1-.1 1.2-1.3.4-1.7l-1-.5c-1-.5-1.6-1.5-1.6-2.6v-5.3c0-.9.2-1.7.6-2.4l2.1-3.9c.9-1.6 1-3.6.3-5.3-.6-1.5-1.6-2.6-2.6-3.4 1-1 1.5-2 1.5-3.5 0-1.5-1-3-3-3h-2z' fill='url(#g)'/>
      </g>
      <!-- Bottom-right: Mug -->
      <g transform='translate(56,56)'>
        <rect x='4' y='8' width='20' height='22' rx='3' ry='3' fill='url(#g)'/>
        <circle cx='30' cy='20' r='6' fill='none' stroke='rgba(0,0,0,0.08)' stroke-width='3'/>
      </g>
      <!-- Sparse dots for extra texture -->
      <circle cx='10' cy='12' r='1' fill='rgba(0,0,0,0.05)'/>
      <circle cx='84' cy='24' r='1' fill='rgba(0,0,0,0.05)'/>
      <circle cx='22' cy='86' r='1' fill='rgba(0,0,0,0.05)'/>
    </svg>
  `);
  return (
    <section id="home" className="relative min-h-[80vh] flex items-center overflow-hidden">
      {/* Warm tint to neutralize grey */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(255, 248, 240, 0.5)' }}
      ></div>
      {/* Repeating vase icons pattern */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,${vasePatternSvg}")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '96px 96px',
          backgroundPosition: 'center'
        }}
      ></div>
      {/* Gradient overlay */}
      <div className="absolute inset-0 hero-gradient opacity-10"></div>
      
      <div className="container mx-auto px-4 grid lg:grid-cols-5 gap-12 items-center relative z-10">
        {/* Content */}
        <div className="space-y-8 lg:col-span-2">
          <div className="space-y-4">
            <h1 className={`text-4xl lg:text-6xl leading-tight ${typography.title}`}>
              <span className="text-brand-primary">Quirky</span> Pottery for{" "}
              <span className="text-brand-secondary">Everyday</span> Magic
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-lg">
              Welcome to {BRAND_NAME}. Discover unique, handcrafted pottery pieces that
              bring character and charm to your daily rituals.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="quirky" size="lg" className="group">
              <a href="/?category=all#shop">
                Shop Collection
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="/artist">Our Story</a>
            </Button>
          </div>

          {/* Honest launch statements instead of inflated stats */}
          <div className="flex space-x-8 pt-4">
            <div>
              <div className={`text-2xl text-brand-primary ${typography.heading}`}>Handcrafted</div>
              <div className={`text-sm text-muted-foreground ${typography.subheading}`}>Small-batch pottery, made with care</div>
            </div>
            <div>
              <div className={`text-2xl text-brand-primary ${typography.heading}`}>Quality First</div>
              <div className={`text-sm text-muted-foreground ${typography.subheading}`}>No mass-production, only unique pieces</div>
            </div>
            <div>
              <div className={`text-2xl text-brand-primary ${typography.heading}`}>Sustainable</div>
              <div className={`text-sm text-muted-foreground ${typography.subheading}`}>Eco-friendly materials and practices</div>
            </div>
          </div>
        </div>

        {/* Hero Image Carousel */}
        <div className="relative lg:col-span-3 lg:justify-self-end lg:ml-16 xl:ml-24">
          <div className="relative w-full max-w-[92vw] lg:w-[620px] xl:w-[700px] flex-shrink-0 overflow-hidden rounded-2xl shadow-quirky hover:scale-105 transition-smooth">
            <ProductImageCarousel
              images={HERO_CAROUSEL_IMAGES}
              alt="Beautiful handcrafted pottery collection"
              className="w-full h-[420px] sm:h-[520px] lg:h-[620px]"
              showArrows={true}
              showDots={true}
              autoPlay={true}
              autoPlayInterval={4000}
              showCounter={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
