import { POT_SKETCH_ASSETS, type PotStyleId } from "@/config/potCustomizer";
import { cn } from "@/lib/utils";

interface PotShapeThumbProps {
  styleId: PotStyleId;
  className?: string;
}

/** Small sketch thumbnail for shape selection cards */
export const PotShapeThumb = ({ styleId, className }: PotShapeThumbProps) => (
  <div
    className={cn(
      "relative aspect-square rounded-lg bg-[#FAF6F0]/80 p-2",
      className,
    )}
    aria-hidden
  >
    <img
      src={POT_SKETCH_ASSETS[styleId].sketch}
      alt=""
      className="h-full w-full object-contain"
      draggable={false}
    />
  </div>
);
