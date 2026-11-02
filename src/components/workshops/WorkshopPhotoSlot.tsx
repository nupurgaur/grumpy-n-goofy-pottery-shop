import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";

type WorkshopPhotoSlotProps = {
  /** Set when a workshop photo is ready — leave empty to show the placeholder */
  imageUrl?: string;
  alt: string;
  className?: string;
  aspectClass?: string;
};

export const WorkshopPhotoSlot = ({
  imageUrl,
  alt,
  className,
  aspectClass = "aspect-[4/3]",
}: WorkshopPhotoSlotProps) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-xl border border-border/50 shadow-card",
      className,
    )}
  >
    {imageUrl ? (
      <img
        src={imageUrl}
        alt={alt}
        className={cn("h-full w-full object-cover object-center", aspectClass)}
      />
    ) : (
      <div
        className={cn(
          "flex flex-col items-center justify-center bg-[#FAF6F0]/90 min-h-[12rem] sm:min-h-[14rem]",
          aspectClass,
        )}
      >
        <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-brand-secondary/25 bg-[#FCE8EE]/60">
            <ImageIcon className="h-5 w-5 text-brand-secondary/60" strokeWidth={1.5} />
          </div>
          <p className="text-[0.65rem] sm:text-xs font-sans uppercase tracking-[0.14em] text-muted-foreground/70">
            Workshop photo
          </p>
        </div>
      </div>
    )}
  </div>
);
