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
import WorkshopSessionManagement from "@/components/admin/WorkshopSessionManagement";

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
      const { error } = await supabase
        .from("workshop_tabs")
        .update({
          label: draft.label,
          tagline: draft.tagline,
          is_visible: draft.is_visible,
          sort_order: draft.sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", tab.id);
      if (error) throw error;
      toast({ title: "Category updated", description: `${draft.label} saved.` });
      await refresh();
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save category",
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
      const { error } = await supabase
        .from("workshop_experiences")
        .update({
          title: draft.title,
          tagline: draft.tagline,
          description: draft.description,
          duration: draft.duration,
          price: draft.price,
          price_label: draft.price_label,
          additional_note: draft.additional_note,
          image_url: draft.image_url,
          is_visible: draft.is_visible,
          sort_order: draft.sort_order,
          time_slot: draft.time_slot,
          includes: draft.includes,
          add_ons: draft.add_ons,
          firing_note: draft.firing_note,
          message_card: draft.message_card,
          status_text: draft.status_text,
          updated_at: new Date().toISOString(),
        })
        .eq("id", exp.id);
      if (error) throw error;
      toast({ title: "Workshop updated", description: `${draft.title} saved.` });
      await refresh();
    } catch (err: unknown) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Could not save workshop",
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
          Publish or hide workshop categories and edit pricing, copy, and images.
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
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                              value={d.title}
                              onChange={(e) => updateExpDraft(exp.id, { title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                              value={d.image_url}
                              onChange={(e) => updateExpDraft(exp.id, { image_url: e.target.value })}
                              placeholder="/workshops/example.png"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Tagline</Label>
                          <Input
                            value={d.tagline}
                            onChange={(e) => updateExpDraft(exp.id, { tagline: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            value={d.description}
                            onChange={(e) => updateExpDraft(exp.id, { description: e.target.value })}
                            rows={3}
                          />
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>Price (₹)</Label>
                            <Input
                              type="number"
                              value={d.price}
                              onChange={(e) =>
                                updateExpDraft(exp.id, { price: Number(e.target.value) })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Price label</Label>
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
                              <Label>Duration</Label>
                              <Input
                                value={d.duration ?? ""}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { duration: e.target.value })
                                }
                              />
                            </div>
                          )}
                        </div>
                        {(tab.id === "one-time" || tab.id === "private-parties") && (
                          <div className="space-y-2">
                            <Label>Additional note</Label>
                            <Input
                              value={d.additional_note ?? ""}
                              onChange={(e) =>
                                updateExpDraft(exp.id, { additional_note: e.target.value })
                              }
                            />
                          </div>
                        )}
                        {(tab.id === "date-night" || tab.id === "private-parties") && (
                          <>
                            <div className="space-y-2">
                              <Label>Time slot</Label>
                              <Input
                                value={d.time_slot ?? ""}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, { time_slot: e.target.value })
                                }
                              />
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
                              <Label>Add-ons (comma-separated)</Label>
                              <Input
                                value={d.add_ons.join(", ")}
                                onChange={(e) =>
                                  updateExpDraft(exp.id, {
                                    add_ons: e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Firing note</Label>
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
                        {tab.id === "courses" && (
                          <div className="space-y-2">
                            <Label>Status text</Label>
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
    <WorkshopSessionManagement />
    </div>
  );
};

export default WorkshopManagement;
