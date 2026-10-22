import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CartItem } from "@/hooks/useCart";
import { isWorkshopCartItem } from "@/config/workshops";
import {
  getMinAgeForWorkshop,
  getParticipantUnitLabel,
  getRequiredParticipantCount,
  getWorkshopBookingMeta,
  type WorkshopParticipant,
} from "@/lib/workshopParticipants";

type WorkshopParticipantFormProps = {
  items: CartItem[];
  participantsByItemId: Record<string, WorkshopParticipant[]>;
  onChange: (cartItemId: string, participants: WorkshopParticipant[]) => void;
  validationErrors: string[];
};

export function WorkshopParticipantForm({
  items,
  participantsByItemId,
  onChange,
  validationErrors,
}: WorkshopParticipantFormProps) {
  const workshopItems = items.filter((item) =>
    isWorkshopCartItem(item.product_id, item.product_name),
  );

  if (workshopItems.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participant Details</CardTitle>
        <p className="text-sm text-muted-foreground">
          Add the full name and age for every participant. Payment stays disabled until all details are valid.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors.length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 space-y-1">
            {validationErrors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        {workshopItems.map((item) => {
          const booking = getWorkshopBookingMeta(item);
          if (!booking) return null;

          const participants = participantsByItemId[item.id] ?? [];
          const unitLabel = getParticipantUnitLabel(booking.scheduleId);
          const minAge = getMinAgeForWorkshop(booking.scheduleId);
          const requiredCount = getRequiredParticipantCount(booking.scheduleId, item.quantity);

          return (
            <div key={item.id} className="space-y-4 rounded-lg border border-border/60 p-4">
              <div>
                <p className="font-medium text-brand-primary">{item.product_name.replace(/^Workshop — /, "")}</p>
                <p className="text-sm text-muted-foreground">
                  {requiredCount} {unitLabel}
                  {requiredCount === 1 ? "" : "s"} required · minimum age {minAge}+
                </p>
              </div>

              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div key={`${item.id}-${index}`} className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor={`${item.id}-name-${index}`}>
                        {booking.scheduleId === "date-night"
                          ? `Couple member ${index + 1} name *`
                          : `Participant ${index + 1} name *`}
                      </Label>
                      <Input
                        id={`${item.id}-name-${index}`}
                        value={participant.name}
                        onChange={(event) => {
                          const next = [...participants];
                          next[index] = { ...next[index], name: event.target.value };
                          onChange(item.id, next);
                        }}
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${item.id}-age-${index}`}>Age *</Label>
                      <Input
                        id={`${item.id}-age-${index}`}
                        type="number"
                        min={0}
                        max={120}
                        value={participant.age}
                        onChange={(event) => {
                          const next = [...participants];
                          next[index] = { ...next[index], age: event.target.value };
                          onChange(item.id, next);
                        }}
                        placeholder="Age"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
