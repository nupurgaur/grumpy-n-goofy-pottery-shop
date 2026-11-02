import { useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getWorkshopSessionDateRange,
  useWorkshopSessionAdminList,
  type WorkshopSessionTimeFilter,
  type WorkshopSessionTypeFilter,
} from "@/hooks/useWorkshopSessions";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  WORKSHOP_SCHEDULE_IDS,
  getActiveWorkshopSchedules,
} from "@/config/workshops";
import { useWorkshopCatalog } from "@/hooks/useWorkshopCatalog";
import { generateUpcomingWorkshopSessions } from "@/lib/workshopSessionGeneration";
import { type WorkshopScheduleId } from "@/lib/workshopSchedule";
import { RefreshCw, Save } from "lucide-react";

const SCHEDULE_LABELS: Record<WorkshopScheduleId, string> = {
  "paint-your-own-pot": "Paint Your Own Pot",
  "handbuilding-ceramics": "Handbuilding Ceramics",
  "wheel-throwing": "Wheel Throwing",
  "date-night": "Pottery date for couples",
  "private-clay-parties": "Private Clay Parties",
};

const TIME_FILTER_LABELS: Record<WorkshopSessionTimeFilter, string> = {
  "1d": "Today",
  "1w": "Next 7 days",
  "2w": "Next 2 weeks",
  "1m": "Next 30 days",
  "3m": "Next 90 days",
  all: "All upcoming",
};

const WorkshopSessionManagement = () => {
  const [timeFilter, setTimeFilter] = useState<WorkshopSessionTimeFilter>("1m");
  const [typeFilter, setTypeFilter] = useState<WorkshopSessionTypeFilter>("all");
  const { allExperiences } = useWorkshopCatalog({ includeHidden: true });
  const activeWorkshopSchedules = useMemo(
    () => getActiveWorkshopSchedules(allExperiences),
    [allExperiences],
  );
  const { sessions, loading, refresh } = useWorkshopSessionAdminList(timeFilter, typeFilter);
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [capacityDrafts, setCapacityDrafts] = useState<Record<string, number>>({});

  const groupedSessions = useMemo(() => {
    return sessions.reduce<Record<string, typeof sessions>>((acc, session) => {
      const key = session.sessionDate;
      acc[key] = acc[key] ? [...acc[key], session] : [session];
      return acc;
    }, {});
  }, [sessions]);

  const summary = useMemo(() => {
    const totalBooked = sessions.reduce((sum, session) => sum + session.booked, 0);
    const totalRemaining = sessions.reduce((sum, session) => sum + session.remaining, 0);
    const fullSessions = sessions.filter((session) => session.remaining <= 0).length;
    return { totalBooked, totalRemaining, fullSessions };
  }, [sessions]);

  const dateRangeLabel = useMemo(() => {
    const { from, to } = getWorkshopSessionDateRange(timeFilter);
    if (!to) return `From ${format(parseISO(from), "MMM d, yyyy")}`;
    return `${format(parseISO(from), "MMM d")} – ${format(parseISO(to), "MMM d, yyyy")}`;
  }, [timeFilter]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateUpcomingWorkshopSessions(activeWorkshopSchedules);
      await supabase.rpc("sync_workshop_sessions_from_orders");
      toast({
        title: "Sessions generated",
        description: "Upcoming workshop dates and time slots are ready.",
      });
      await refresh();
    } catch (error) {
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Could not generate sessions",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const saveCapacity = async (sessionId: string, capacity: number) => {
    if (!Number.isInteger(capacity) || capacity < 1) {
      toast({
        title: "Invalid capacity",
        description: "Capacity must be at least 1.",
        variant: "destructive",
      });
      return;
    }

    setSavingId(sessionId);
    try {
      const { error } = await supabase
        .from("workshop_sessions")
        .update({ capacity, updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;

      toast({ title: "Capacity updated" });
      await refresh();
    } catch (error) {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Could not update capacity",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (sessionId: string, isActive: boolean) => {
    setSavingId(sessionId);
    try {
      const { error } = await supabase
        .from("workshop_sessions")
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (error) throw error;
      await refresh();
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Could not update session",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Workshop Schedule & Capacity</CardTitle>
              <CardDescription>
                View upcoming workshop dates, timings, bookings, and remaining spots.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={refresh} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={handleGenerate} disabled={generating}>
                {generating ? "Generating..." : "Generate Upcoming Sessions"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time range</p>
              <Select
                value={timeFilter}
                onValueChange={(value) => setTimeFilter(value as WorkshopSessionTimeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TIME_FILTER_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Workshop type</p>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value as WorkshopSessionTypeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All workshops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All workshops</SelectItem>
                  {WORKSHOP_SCHEDULE_IDS.map((scheduleId) => (
                    <SelectItem key={scheduleId} value={scheduleId}>
                      {SCHEDULE_LABELS[scheduleId]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg border border-border/60 p-3 text-sm">
              <p className="text-muted-foreground">Total booked</p>
              <p className="text-xl font-semibold">{summary.totalBooked}</p>
            </div>

            <div className="rounded-lg border border-border/60 p-3 text-sm">
              <p className="text-muted-foreground">Spots remaining</p>
              <p className="text-xl font-semibold">{summary.totalRemaining}</p>
              <p className="text-xs text-muted-foreground">{summary.fullSessions} full sessions</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Showing {dateRangeLabel}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading workshop sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions in this range. Try a wider time filter or click &quot;Generate Upcoming Sessions&quot;.
          </p>
        ) : (
          Object.entries(groupedSessions).map(([date, daySessions]) => (
            <div key={date} className="space-y-3">
              <h3 className="font-medium text-brand-primary">
                {format(parseISO(date), "EEEE, MMM d, yyyy")}
              </h3>
              <div className="space-y-3">
                {daySessions.map((session) => {
                  const capacityValue = capacityDrafts[session.sessionId] ?? session.capacity;
                  const isFull = session.remaining <= 0;

                  return (
                    <div
                      key={session.sessionId}
                      className="grid gap-3 rounded-lg border border-border/60 p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center"
                    >
                      <div>
                        <p className="font-medium">{SCHEDULE_LABELS[session.scheduleId]}</p>
                        <p className="text-sm text-muted-foreground">{session.slot}</p>
                      </div>

                      <div className="text-sm">
                        <p>
                          Booked:{" "}
                          <span className={session.booked > 0 ? "font-medium text-brand-primary" : ""}>
                            {session.booked}
                          </span>
                        </p>
                        <p>
                          Remaining:{" "}
                          <span className={isFull ? "text-destructive font-medium" : "font-medium"}>
                            {session.remaining}
                          </span>
                          <span className="text-muted-foreground"> / {session.capacity}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          value={capacityValue}
                          onChange={(event) =>
                            setCapacityDrafts((prev) => ({
                              ...prev,
                              [session.sessionId]: Number(event.target.value),
                            }))
                          }
                          className="w-24"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={savingId === session.sessionId}
                          onClick={() => saveCapacity(session.sessionId, capacityValue)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            isFull ? "destructive" : session.remaining <= 2 ? "secondary" : "default"
                          }
                        >
                          {isFull ? "Full" : `${session.remaining} left`}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={session.isActive}
                            onCheckedChange={(checked) => toggleActive(session.sessionId, checked)}
                            disabled={savingId === session.sessionId}
                          />
                          <span className="text-xs text-muted-foreground">Open</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default WorkshopSessionManagement;
