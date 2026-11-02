import { useMemo, useState } from "react";
import {
  addMonths,
  format,
  isSameMonth,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WORKSHOP_SCHEDULE_IDS, WORKSHOP_TIME_SLOTS } from "@/config/workshops";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import { getActiveWorkshopSchedules } from "@/config/workshops";
import {
  useOfflineBookingsForDay,
  useStudioCalendarMonth,
  type StudioSlotCalendarRow,
} from "@/hooks/useStudioCalendar";
import { generateUpcomingWorkshopSessions } from "@/lib/workshopSessionGeneration";
import { buildGoogleCalendarCreateUrl, slotLabelForDate } from "@/lib/googleCalendarWorkshop";
import { isDateAllowedForWorkshop, type WorkshopScheduleId } from "@/lib/workshopSchedule";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, ExternalLink, Plus, RefreshCw, Trash2 } from "lucide-react";

const SCHEDULE_LABELS: Record<WorkshopScheduleId, string> = {
  "paint-your-own-pot": "Paint Your Own Pot",
  "handbuilding-ceramics": "Handbuilding",
  "wheel-throwing": "Wheel Throwing",
  "date-night": "Date night",
  "private-clay-parties": "Private clay party",
};

function slotStatus(row: StudioSlotCalendarRow): "blocked" | "exclusive" | "busy" | "open" {
  if (row.isBlocked) return "blocked";
  if (row.hasExclusiveBooking) return "exclusive";
  if (row.oneTimeUsed >= row.oneTimeCapacity) return "busy";
  if (row.oneTimeUsed > 0) return "busy";
  return "open";
}

function statusBadge(row: StudioSlotCalendarRow) {
  const status = slotStatus(row);
  switch (status) {
    case "blocked":
      return <Badge variant="destructive">Blocked</Badge>;
    case "exclusive":
      return <Badge variant="secondary">{row.exclusiveLabel ?? "Date / private"}</Badge>;
    case "busy":
      return (
        <Badge variant="outline">
          One-time {row.oneTimeUsed}/{row.oneTimeCapacity}
        </Badge>
      );
    default:
      return <Badge>Open</Badge>;
  }
}

const WorkshopStudioCalendar = () => {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [slotDialog, setSlotDialog] = useState<StudioSlotCalendarRow | null>(null);
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();
  const { allExperiences } = useWorkshopCatalog({ includeHidden: true });
  const activeSchedules = useMemo(
    () => getActiveWorkshopSchedules(allExperiences),
    [allExperiences],
  );

  const { rows, loading, refresh } = useStudioCalendarMonth(month);
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;
  const { bookings: offlineBookings, refresh: refreshOffline } =
    useOfflineBookingsForDay(selectedDateStr);

  const rowsByDate = useMemo(() => {
    const map = new Map<string, StudioSlotCalendarRow[]>();
    for (const row of rows) {
      const list = map.get(row.sessionDate) ?? [];
      list.push(row);
      map.set(row.sessionDate, list);
    }
    return map;
  }, [rows]);

  const daySlots = selectedDateStr ? rowsByDate.get(selectedDateStr) ?? [] : [];

  const calendarModifiers = useMemo(() => {
    const hasActivity: Date[] = [];
    for (const [dateStr, dayRows] of rowsByDate.entries()) {
      const active = dayRows.some(
        (r) =>
          r.isBlocked ||
          r.hasExclusiveBooking ||
          r.oneTimeUsed > 0,
      );
      if (active) hasActivity.push(parseISO(dateStr));
    }
    return { hasActivity };
  }, [rowsByDate]);

  const [offlineForm, setOfflineForm] = useState({
    slot: WORKSHOP_TIME_SLOTS[0],
    scheduleId: "handbuilding-ceramics" as WorkshopScheduleId,
    seats: 1,
    customerName: "",
    phone: "",
    notes: "",
  });

  const [blockNotes, setBlockNotes] = useState("");
  const [blockEnabled, setBlockEnabled] = useState(false);

  const openSlotDetail = (row: StudioSlotCalendarRow) => {
    setSlotDialog(row);
    setBlockEnabled(row.isBlocked);
    setBlockNotes(row.notes ?? "");
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateUpcomingWorkshopSessions(activeSchedules);
      await supabase.rpc("sync_workshop_sessions_from_orders");
      toast({ title: "Sessions synced", description: "Upcoming slots are ready." });
      await refresh();
    } catch (error) {
      toast({
        title: "Sync failed",
        description: error instanceof Error ? error.message : "Could not generate sessions",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveSlotOverride = async () => {
    if (!slotDialog) return;
    try {
      const { error } = await supabase.from("studio_slot_overrides").upsert(
        {
          session_date: slotDialog.sessionDate,
          slot: slotDialog.slot,
          is_blocked: blockEnabled,
          notes: blockNotes.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "session_date,slot" },
      );
      if (error) throw error;
      toast({ title: "Slot updated" });
      setSlotDialog(null);
      await refresh();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not save",
        variant: "destructive",
      });
    }
  };

  const addOfflineBooking = async () => {
    if (!selectedDateStr) return;
    try {
      const { error } = await supabase.from("workshop_offline_bookings").insert({
        session_date: selectedDateStr,
        slot: offlineForm.slot,
        schedule_id: offlineForm.scheduleId,
        seats: offlineForm.seats,
        customer_name: offlineForm.customerName.trim() || null,
        phone: offlineForm.phone.trim() || null,
        notes: offlineForm.notes.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Offline booking added" });
      setOfflineOpen(false);
      await refresh();
      await refreshOffline();
    } catch (error) {
      toast({
        title: "Could not add booking",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const deleteOfflineBooking = async (id: string) => {
    try {
      const { error } = await supabase.from("workshop_offline_bookings").delete().eq("id", id);
      if (error) throw error;
      await refresh();
      await refreshOffline();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Could not delete",
        variant: "destructive",
      });
    }
  };

  const googleUrlForSlot = (row: StudioSlotCalendarRow, title: string, details: string) =>
    buildGoogleCalendarCreateUrl({
      title,
      sessionDate: row.sessionDate,
      slot: row.slot,
      details,
    });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Studio calendar</CardTitle>
              <CardDescription>
                Shared capacity: 8 seats per time slot for one-time workshops. Date night or private
                parties block the whole slot. Any one-time booking blocks date night and private
                parties for that slot.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refresh} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Syncing…" : "Sync sessions"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,340px)_1fr]">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m, -1))}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="font-medium">{format(month, "MMMM yyyy")}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMonth((m) => addMonths(m, 1))}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Calendar
              mode="single"
              month={month}
              onMonthChange={setMonth}
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date ? startOfDay(date) : undefined)}
              modifiers={calendarModifiers}
              modifiersClassNames={{
                hasActivity: "bg-brand-primary/15 font-semibold",
              }}
              disabled={(date) => !isSameMonth(date, month)}
            />
            <p className="text-xs text-muted-foreground">
              Highlighted days have bookings, blocks, or exclusive events. Wed–Sun only.
            </p>
          </div>

          <div className="space-y-4">
            {selectedDate ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-medium text-brand-primary">
                    {format(selectedDate, "EEEE, MMM d, yyyy")}
                  </h3>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!isDateAllowedForWorkshop("handbuilding-ceramics", selectedDate)}
                    onClick={() => setOfflineOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Offline booking
                  </Button>
                </div>

                {daySlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {isDateAllowedForWorkshop("handbuilding-ceramics", selectedDate)
                      ? "No slots (closed Mon–Tue)."
                      : "Studio closed on Mondays and Tuesdays."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((row) => (
                      <button
                        key={row.slot}
                        type="button"
                        onClick={() => openSlotDetail(row)}
                        className="w-full rounded-lg border border-border/60 p-4 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium">{row.slot}</p>
                          {statusBadge(row)}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          One-time seats: {row.oneTimeUsed} / {row.oneTimeCapacity}
                          {row.hasExclusiveBooking ? " · Exclusive event booked" : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {offlineBookings.length > 0 && (
                  <div className="space-y-2 border-t pt-4">
                    <p className="text-sm font-medium">Offline entries this day</p>
                    {offlineBookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex items-start justify-between gap-2 rounded-md border p-3 text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {SCHEDULE_LABELS[b.scheduleId]} · {b.slot}
                          </p>
                          <p className="text-muted-foreground">
                            {b.seats} seat{b.seats !== 1 ? "s" : ""}
                            {b.customerName ? ` · ${b.customerName}` : ""}
                          </p>
                          {b.notes && <p className="text-muted-foreground">{b.notes}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteOfflineBooking(b.id)}
                          aria-label="Remove offline booking"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Select a day to view time slots.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(slotDialog)} onOpenChange={(open) => !open && setSlotDialog(null)}>
        <DialogContent className="max-w-lg">
          {slotDialog && (
            <>
              <DialogHeader>
                <DialogTitle>{slotLabelForDate(slotDialog.sessionDate, slotDialog.slot)}</DialogTitle>
                <DialogDescription>
                  Manage manual blocks and add this slot to Google Calendar for reminders.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p>One-time: {slotDialog.oneTimeUsed} / {slotDialog.oneTimeCapacity}</p>
                  <p>
                    Exclusive: {slotDialog.hasExclusiveBooking ? "Yes" : "No"}
                    {slotDialog.exclusiveLabel ? ` (${slotDialog.exclusiveLabel})` : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="block-slot">Block entire slot (offline closure)</Label>
                  <Switch
                    id="block-slot"
                    checked={blockEnabled}
                    onCheckedChange={setBlockEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-notes">Admin notes</Label>
                  <Textarea
                    id="block-notes"
                    value={blockNotes}
                    onChange={(e) => setBlockNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                {(() => {
                  const url = googleUrlForSlot(
                    slotDialog,
                    `Studio — ${slotDialog.slot}`,
                    `One-time ${slotDialog.oneTimeUsed}/${slotDialog.oneTimeCapacity}. Exclusive: ${slotDialog.hasExclusiveBooking}`,
                  );
                  return url ? (
                    <Button variant="outline" className="w-full" asChild>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Add to Google Calendar
                      </a>
                    </Button>
                  ) : null;
                })()}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSlotDialog(null)}>Cancel</Button>
                <Button onClick={saveSlotOverride}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={offlineOpen} onOpenChange={setOfflineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offline booking</DialogTitle>
            <DialogDescription>
              Record phone or walk-in bookings. Rules match online orders (exclusive vs one-time).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label>Time slot</Label>
              <Select
                value={offlineForm.slot}
                onValueChange={(v) => setOfflineForm((f) => ({ ...f, slot: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKSHOP_TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Experience</Label>
              <Select
                value={offlineForm.scheduleId}
                onValueChange={(v) =>
                  setOfflineForm((f) => ({ ...f, scheduleId: v as WorkshopScheduleId }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WORKSHOP_SCHEDULE_IDS.map((id) => (
                    <SelectItem key={id} value={id}>{SCHEDULE_LABELS[id]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Seats</Label>
              <Input
                type="number"
                min={1}
                value={offlineForm.seats}
                onChange={(e) =>
                  setOfflineForm((f) => ({ ...f, seats: Number(e.target.value) || 1 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Customer name</Label>
              <Input
                value={offlineForm.customerName}
                onChange={(e) => setOfflineForm((f) => ({ ...f, customerName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={offlineForm.phone}
                onChange={(e) => setOfflineForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={offlineForm.notes}
                onChange={(e) => setOfflineForm((f) => ({ ...f, notes: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfflineOpen(false)}>Cancel</Button>
            <Button onClick={addOfflineBooking}>Save booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkshopStudioCalendar;
