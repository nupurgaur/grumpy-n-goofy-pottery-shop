import { BRAND_NAME } from "@/config/brand";
import {
  FOUNDER_NAME,
  FOUNDER_PHOTO,
  FOUNDER_PHOTO_ALT,
} from "@/config/founder";
import { typography } from "@/config/typography";

export const WorkshopPageIntro = () => {
  return (
    <header className="mb-5 sm:mb-6 space-y-4">
      <div className="text-center max-w-3xl mx-auto">
        <h1
          className={`text-2xl sm:text-3xl lg:text-4xl leading-tight ${typography.title}`}
        >
          <span className="text-brand-primary">Workshops</span>{" "}
          <span className="text-brand-primary">&amp;</span>{" "}
          <span className="text-brand-secondary">Creative Experiences</span>
        </h1>
      </div>

      <section
        className="rounded-2xl border border-border/50 bg-card/80 shadow-sm p-4 sm:p-5 max-w-5xl mx-auto"
        aria-labelledby="workshop-studio-story"
      >
        <h2 id="workshop-studio-story" className="sr-only">
          About our studio
        </h2>
        <div className="grid sm:grid-cols-5 gap-4 sm:gap-5 items-stretch">
          <div className="sm:col-span-3 space-y-2.5 text-sm sm:text-[0.9375rem] text-foreground/85 font-sans leading-relaxed">
            <p>
              At {BRAND_NAME} Pottery Studio, we believe pottery is for everyone
              — not just artists or people who grew up around creativity.
            </p>
            <p>
              We believe clay should feel welcoming, playful, and low-pressure;
              that making with your hands is its own kind of joy; and that every
              beginner deserves patient guidance, room to experiment, and a
              studio that cheers you on.
            </p>
            <p>
              I&apos;m {FOUNDER_NAME}, and I&apos;ve been practicing pottery since
              2023 with a focus on handbuilt forms and wheel throwing. I lead our
              workshops with the same curiosity I had on day one — and I&apos;m
              here to help you find yours.
            </p>
          </div>

          <div className="sm:col-span-2 min-h-0 self-stretch">
            <div
              className="relative h-32 sm:h-full w-full overflow-hidden rounded-xl shadow-sm"
            >
              <img
                src={FOUNDER_PHOTO}
                alt={FOUNDER_PHOTO_ALT}
                className="absolute inset-0 size-full min-h-0 min-w-0 object-cover object-[50%_22%]"
              />
            </div>
          </div>
        </div>
      </section>
    </header>
  );
};
