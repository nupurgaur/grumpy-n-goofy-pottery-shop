import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Instagram, Facebook, Twitter } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { typography } from "@/config/typography";
import { Link } from "react-router-dom";
import { INSTAGRAM_URL } from "@/config/social";

const ArtistPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-16 sm:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 xl:gap-16 items-start">
              {/* Story content — left */}
              <div className="lg:col-span-7 xl:col-span-8 min-w-0">
            <h1
              className={`text-3xl lg:text-4xl text-brand-primary mb-8 leading-tight ${typography.title}`}
            >
              My Journey to Clay
            </h1>

            <div className="space-y-4 text-muted-foreground font-sans leading-relaxed max-w-none">
              <p className="text-foreground/90">Hi, I&apos;m Nupur.</p>

              <p>
                I&apos;m originally from Gorakhpur, and like many small-town girls with
                big dreams, I moved to Delhi in 2014 for higher studies. Over the
                years, Delhi became much more than a city where I studied and
                worked&mdash;it became my second home. I built my career there, spent
                four years working, and got married in 2021.
              </p>

              <p>
                In 2022, I moved to Mumbai for work as a software engineer. Like many
                people in tech, my days revolved around screens, meetings, and
                deadlines. I enjoyed my work, but I was searching for something that
                felt more hands-on and creative.
              </p>

              <p>
                That changed in 2023 when I attended a Nerikomi pottery workshop in
                Mumbai. What started as a simple workshop quickly turned into a passion.
                I went on to learn wheel throwing, handbuilding, glaze chemistry, and clay
                bodies through courses, workshops, and countless hours of practice.
              </p>

              <p>
                Most of that practice happened after work. While others relaxed with
                Netflix, I spent my evenings making pottery from a small home studio
                setup, firing pieces through rental kilns, and learning one experiment at
                a time.
              </p>

              <p>
                What surprised me most was realizing that pottery isn&apos;t just for
                artists. You don&apos;t need a creative background to enjoy working with
                clay&mdash;you just need curiosity and the willingness to begin.
              </p>

              <p>
                Today, as I prepare to open my studio in Delhi NCR and transition into
                pottery full-time, I feel like I&apos;ve found my ikigai.
              </p>

              <p>
                Pottery grounds me. It helps me slow down, disconnect from screens, and
                lose myself in the joy of making. Through Goofy n Grumpy, I hope to
                share that feeling with others through handmade ceramics, workshops,
                templates, and a welcoming creative community.
              </p>

              <p>
                Because if a software engineer from Gorakhpur can fall in love with clay
                and build a life around it, maybe pottery is for more people than we
                think.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-3">
              <Button asChild variant="quirky" size="lg">
                <Link to="/contact">Get in Touch</Link>
              </Button>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="icon" aria-label="Instagram">
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-4 w-4" />
                  </a>
                </Button>
                {[Facebook, Twitter].map((Icon, i) => (
                  <Button key={i} variant="outline" size="icon" aria-label="Social link">
                    <Icon className="h-4 w-4" />
                  </Button>
                ))}
              </div>
            </div>
              </div>

              {/* Photo placeholder — right */}
              <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-28">
                <div
                  className="flex min-h-[320px] sm:min-h-[400px] lg:min-h-[520px] items-center justify-center rounded-2xl bg-white p-8 sm:p-10 border border-border/40"
                  aria-label="Photo placeholder"
                >
                  <BrandLogo
                    iconClassName="h-28 sm:h-32 lg:h-36"
                    titleClassName="text-3xl sm:text-4xl"
                    className="flex-col sm:flex-row items-center"
                  />
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ArtistPage;
