import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useWorkshopCatalog,
  type WorkshopExperienceRecord,
  type WorkshopTabRecord,
} from "@/hooks/useWorkshopCatalog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CalendarHeart, GraduationCap, PartyPopper, Save, Sparkles } from "lucide-react";
import { WorkshopFoodBeverageContactFields } from "@/components/admin/WorkshopFoodBeverageContactFields";
import {
  encodeFoodBeverageContactAddOns,
  parseFoodBeverageContactConfig,
} from "@/lib/workshopFoodBeverage";
import {
  WORKSHOP_PRODUCT_IDS,
  WORKSHOP_SCHEDULE_NOTE,
  type WorkshopScheduleId,
  type WorkshopTopTab,
} from "@/config/workshops";

function getSupabaseErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const row = error as { message?: string; details?: string; hint?: string };
    const parts = [row.message, row.details, row.hint].filter(Boolean);
    if (parts.length > 0) return parts.join(" — ");
  }
  if (error instanceof Error) return error.message;
  return "Could not save workshop";
}

async function upsertWorkshopTabRecord(tab: WorkshopTabRecord) {
  const { error } = await supabase.from("workshop_tabs").upsert(
    {
      id: tab.id,
      label: tab.label,
      tagline: tab.tagline,
      is_visible: tab.is_visible,
      sort_order: tab.sort_order,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw error;
}

const EXPERIENCE_FIELD_HINTS: Partial<
  Record<WorkshopTopTab, { description: string }>
> = {
  "one-time": {
    description: "Shown on the experience card and detail section.",
  },
  "date-night": {
    description: "Main paragraph under the photo on the workshop page.",
  },
  "private-parties": {
    description: "Main paragraph under the photo on the workshop page.",
  },
  courses: {
    description: "Body copy on the courses tab.",
  },
};

const TAB_ICONS = {
  "one-time": Sparkles,
  "date-night": CalendarHeart,
  "private-parties": PartyPopper,
  courses: GraduationCap,
} as const;

const WorkshopManagement = () => {
  const { allTabs, allExperiences, loading, refresh } = useWorkshopCatalog({ includeHidden: true });
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);
  const [tabDrafts, setTabDrafts] = useState<Record<string, WorkshopTabRecord>>({});
  const [expDrafts, setExpDrafts] = useState<Record<string, WorkshopExperienceRecord>>({});

  const getTabDraft = (tab: WorkshopTabRecord) =>
    tabDrafts[tab.id] ?? tab;

  const getExpDraft = (exp: WorkshopExperienceRecord) =>
    expDrafts[exp.id] ?? exp;

  const updateTabDraft = (id: string, patch: Partial<WorkshopTabRecord>) => {
    const base = allTabs.find((t) => t.id === id)!;
    setTabDrafts((prev) => ({ ...prev, [id]: { ...getTabDraft(base), ...patch } }));
  };

  const updateExpDraft = (id: string, patch: Partial<WorkshopExperienceRecord>) => {
    const base = allExperiences.find((e) => e.id === id)!;
    setExpDrafts((prev) => ({ ...prev, [id]: { ...getExpDraft(base), ...patch } }));
  };

  const saveTab = async (tab: WorkshopTabRecord) => {
    const draft = getTabDraft(tab);
    setSaving(tab.id);
    try {
      await upsertWorkshopTabRecord({
        id: tab.id,
        label: draft.label,
        tagline: draft.tagline,
        is_visible: draft.is_visible,
        sort_order: draft.sort_order,
      });
      toast({ title: "Category updated", description: `${draft.label} saved.` });
      setTabDrafts((prev) => {
        const next = { ...prev };
        delete next[tab.id];
        return next;
      });
      await refresh();
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: getSupabaseErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const saveExperience = async (exp: WorkshopExperienceRecord) => {
    const draft = getExpDraft(exp);
    setSaving(exp.id);
    try {
      if (!Number.isFinite(draft.price)) {
        throw new Error("Price must be a valid number.");
      }

      const parentTab = allTabs.find((tab) => tab.id === draft.tab_id);
      if (parentTab) {
        await upsertWorkshopTabRecord(getTabDraft(parentTab));
      } else {
        await upsertWorkshopTabRecord({
          id: draft.tab_id,
          label: draft.tab_id,
          tagline: "",
          is_visible: true,
          sort_order: draft.sort_order,
        });
      }

      const { error } = await supabase.from("workshop_experiences").upsert(
        {
          id: exp.id,
          tab_id: draft.tab_id,
          title: draft.title,
          tagline: draft.tagline,
          description: draft.description,
          duration: draft.duration,
          price: draft.price,
          price_label: draft.price_label,
          additional_note: draft.additional_note,
          image_url: draft.image_url ?? "",
          is_visible: draft.is_visible,
          sort_order: draft.sort_order,
          time_slot: draft.time_slot,
          includes: draft.includes,
          add_ons: JSON.parse(JSON.stringify(draft.add_ons ?? [])),
          firing_note: draft.firing_note,
          message_card: draft.message_card,
          status_text: draft.status_text,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) throw error;

      const workshopProductId =
        WORKSHOP_PRODUCT_IDS[exp.id as WorkshopScheduleId] ?? null;
      if (workshopProductId != null) {
        const { error: productError } = await supabase
          .from("products")
          .update({ price: draft.price, updated_at: new Date().toISOString() })
          .eq("id", workshopProductId);
        if (productError) {
          console.warn("Workshop catalog saved but product price was not updated:", productError);
        }
      }

      toast({ title: "Workshop updated", description: `${draft.title} saved.` });
      setExpDrafts((prev) => {
        const next = { ...prev };
        delete next[exp.id];
        return next;
      });
      await refresh();
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: getSupabaseErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Workshop Management</CardTitle>
        <CardDescription>
          Fields match what customers see on the workshop page. Save each experience after editing.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={allTabs[0]?.id ?? "one-time"}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6">
            {allTabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id] ?? Sparkles;
              const draft = getTabDraft(tab);
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {!draft.is_visible && (
                    <Badge variant="secondary" className="text-[10px] px-1">Hidden</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {allTabs.map((tab) => {
            const draft = getTabDraft(tab);
            const experiences = allExperiences
              .filter((e) => e.tab_id === tab.id)
              .sort((a, b) => a.sort_order - b.sort_order);

            return (
              <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Category settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <Label>Show on workshop page</Label>
                        <p className="text-xs text-muted-foreground">
                          Hidden categories won&apos;t appear to customers
                        </p>
                      </div>
                      <Switch
                        checked={draft.is_visible}
                        onCheckedChange={(checked) =>
                          updateTabDraft(tab.id, { is_visible: checked })
                        }
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category title</Label>
                        <Input
                          value={draft.label}
                          onChange={(e) => updateTabDraft(tab.id, { label: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Sort order</Label>
                        <Input
                          type="number"
                          value={draft.sort_order}
                          onChange={(e) =>
                            updateTabDraft(tab.id, { sort_order: Number(e.target.value) })
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Tagline</Label>
                      <Textarea
                        value={draft.tagline}
                        onChange={(e) => updateTabDraft(tab.id, { tagline: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <Button
                      onClick={() => saveTab(tab)}
                      disabled={saving === tab.id}
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save category
                    </Button>
                  </CardContent>
                </Card>

                {experiences.map((exp) => {
                  const d = getExpDraft(exp);
                  return (
                    <Card key={exp.id}>
                      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4">
                        <div>
                          <CardTitle className="text-lg">{d.title}</CardTitle>
                          <CardDescription>{exp.id}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={d.is_visible}
                            onCheckedChange={(checked) =>
                              updateExpDraft(exp.id, { is_visible: checked })
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {d.is_visible ? "Published" : "Hidden"}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground">
                          Same fields as the public workshop listing for this category.
                        </p>

                        {tab.id !== "courses" && (
                          <>
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label>Title (page heading)</Label>
                                <Input
                                  value={d.title}
                                  onChange={(e) =>
                                    updateExpDraft(exp.id, { title: e.target.value })
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Image URL</Label>
                                <Input
                                  value={d.image_url}
                                  onChange={(e) =>
                                    updateExpDraft(exp.id, { image_url: e.target.value })
                                  }
                                  placeholder="/workshops/example.png"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Tagline (subtitle)</Label>
                              <Input
                                value={d.tagline}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { tagline: e.target.value })
                                }
                              />
                            </div>
                          </>
                        )}

                        {tab.id === "courses" && (
                          <div className="space-y-2">
                            <Label>Title (page heading)</Label>
                            <Input
                              value={d.title}
                              onChange={(e) =>
                                updateExpDraft(exp.id, { title: e.target.value })
                              }
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={d.description}
                            onChange={(e) =>
                              updateExpDraft(exp.id, { description: e.target.value })
                            }
                            rows={4}
                          />
                          {EXPERIENCE_FIELD_HINTS[tab.id]?.description && (
                            <p className="text-xs text-muted-foreground">
                              {EXPERIENCE_FIELD_HINTS[tab.id]?.description}
                            </p>
                          )}
                        </div>

                        {tab.id !== "courses" && (
                          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label>Price (₹)</Label>
                              <Input
                                type="number"
                                min={0}
                                value={d.price}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { price: Number(e.target.value) })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Price label (on page)</Label>
                              <Input
                                value={d.price_label}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { price_label: e.target.value })
                                }
                                placeholder="₹1500 per person"
                              />
                            </div>
                            {(tab.id === "one-time" || tab.id === "private-parties") && (
                              <div className="space-y-2">
                                <Label>Duration (on page)</Label>
                                <Input
                                  value={d.duration ?? ""}
                                  onChange={(e) =>
                                    updateExpDraft(exp.id, { duration: e.target.value })
                                  }
                                  placeholder="2 Hours"
                                />
                              </div>
                            )}
                            <div className="space-y-2">
                              <Label>Listing order</Label>
                              <Input
                                type="number"
                                min={1}
                                value={d.sort_order}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, {
                                    sort_order: Number(e.target.value),
                                  })
                                }
                              />
                            </div>
                          </div>
                        )}

                        {tab.id === "one-time" && (
                          <div className="space-y-2">
                            <Label>Additional note (italic line on page)</Label>
                            <Input
                              value={d.additional_note ?? ""}
                              onChange={(e) =>
                                updateExpDraft(exp.id, { additional_note: e.target.value })
                              }
                              placeholder="Firing and glazing available at ₹300 per finished piece."
                            />
                          </div>
                        )}

                        {tab.id === "date-night" && (
                          <>
                            <div className="space-y-2">
                              <Label>Time slots (on page)</Label>
                              <Input
                                value={d.time_slot ?? ""}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { time_slot: e.target.value })
                                }
                                placeholder={WORKSHOP_SCHEDULE_NOTE}
                              />
                              <p className="text-xs text-muted-foreground">
                                Summary line on the page. Customers choose 12–2, 3–5, or 6–8 PM
                                when booking (same as handbuilding).
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Includes (comma-separated)</Label>
                              <Input
                                value={d.includes.join(", ")}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, {
                                    includes: e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Firing note (italic line)</Label>
                              <Textarea
                                value={d.firing_note ?? ""}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { firing_note: e.target.value })
                                }
                                rows={2}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Message card quote</Label>
                              <Input
                                value={d.message_card ?? ""}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { message_card: e.target.value })
                                }
                              />
                            </div>
                          </>
                        )}

                        {tab.id === "private-parties" && (
                          <>
                            <div className="space-y-2">
                              <Label>Time slots (on page)</Label>
                              <Input
                                value={d.time_slot ?? ""}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { time_slot: e.target.value })
                                }
                                placeholder={WORKSHOP_SCHEDULE_NOTE}
                              />
                              <p className="text-xs text-muted-foreground">
                                Summary line on the page. Booking offers 12–2, 3–5, and 6–8 PM
                                slots (same as handbuilding).
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Includes (comma-separated)</Label>
                              <Input
                                value={d.includes.join(", ")}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, {
                                    includes: e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </div>
                            <WorkshopFoodBeverageContactFields
                              value={parseFoodBeverageContactConfig(d.add_ons)}
                              onChange={(config) =>
                                updateExpDraft(exp.id, {
                                  add_ons: encodeFoodBeverageContactAddOns(config),
                                })
                              }
                            />
                            <div className="space-y-2">
                              <Label>Additional note (italic line)</Label>
                              <Input
                                value={d.additional_note ?? ""}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { additional_note: e.target.value })
                                }
                              />
                            </div>
                          </>
                        )}

                        {tab.id === "courses" && (
                          <div className="space-y-2">
                            <Label>Status line (below description)</Label>
                            <Input
                              value={d.status_text ?? ""}
                              onChange={(e) =>
                                updateExpDraft(exp.id, { status_text: e.target.value })
                              }
                              placeholder="Coming Soon."
                            />
                          </div>
                        )}
                        <Button
                          onClick={() => saveExperience(exp)}
                          disabled={saving === exp.id}
                          className="gap-2"
                        >
                          <Save className="h-4 w-4" />
                          Save {d.title}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
    </div>
  );
};

export default WorkshopManagement;
