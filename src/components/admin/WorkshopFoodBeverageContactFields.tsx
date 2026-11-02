import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { FoodBeverageContactConfig } from "@/lib/workshopFoodBeverage";

type WorkshopFoodBeverageContactFieldsProps = {
  value: FoodBeverageContactConfig;
  onChange: (value: FoodBeverageContactConfig) => void;
};

export const WorkshopFoodBeverageContactFields = ({
  value,
  onChange,
}: WorkshopFoodBeverageContactFieldsProps) => (
  <div className="space-y-4 rounded-lg border border-border/60 p-4">
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>Food &amp; beverages (contact only)</Label>
        <p className="text-xs text-muted-foreground">
          Optional checkbox at booking — no extra charge; you contact guests separately.
        </p>
      </div>
      <Switch
        checked={value.enabled}
        onCheckedChange={(checked) => onChange({ ...value, enabled: checked })}
      />
    </div>

    {value.enabled && (
      <>
        <div className="space-y-2">
          <Label>Checkbox label</Label>
          <Input
            value={value.checkboxLabel}
            onChange={(e) => onChange({ ...value, checkboxLabel: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Note on workshop page (above booking)</Label>
          <Textarea
            value={value.pageNote}
            onChange={(e) => onChange({ ...value, pageNote: e.target.value })}
            rows={2}
          />
        </div>
      </>
    )}
  </div>
);
