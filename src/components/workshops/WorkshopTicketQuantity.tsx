import { Button } from "@/components/ui/button";
import { MAX_ONE_TIME_TICKETS } from "@/config/workshops";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

type WorkshopTicketQuantityProps = {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  unitLabel?: string;
  compact?: boolean;
  min?: number;
  max?: number;
};

export const WorkshopTicketQuantity = ({
  value,
  onChange,
  label = "Number of People",
  unitLabel = "tickets",
  compact = false,
  min = 1,
  max = MAX_ONE_TIME_TICKETS,
}: WorkshopTicketQuantityProps) => (
  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <p className="text-xs font-sans font-medium text-muted-foreground">{label}</p>
    <div className={cn("flex items-center", compact ? "justify-between gap-3" : "gap-4")}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className={cn("text-center", compact ? "flex-1" : "min-w-[5rem]")}>
        <span className={cn("font-semibold text-brand-primary font-sans", compact ? "text-lg" : "text-2xl")}>
          {value}
        </span>
        <p className="text-[0.65rem] text-muted-foreground font-sans">{unitLabel}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  </div>
);
