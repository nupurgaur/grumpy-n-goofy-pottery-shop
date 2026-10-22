import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  TOP_WORKSHOP_TABS,
  ONE_TIME_EXPERIENCES,
  DATE_NIGHT,
  PRIVATE_CLAY_PARTY,
  COURSES,
  PAUSED_ONE_TIME_EXPERIENCE_IDS,
  type WorkshopTopTab,
  type OneTimeExperienceId,
  type WorkshopScheduleId,
} from "@/config/workshops";

export type WorkshopTabRecord = {
  id: WorkshopTopTab;
  label: string;
  tagline: string;
  is_visible: boolean;
  sort_order: number;
};

export type WorkshopExperienceRecord = {
  id: string;
  tab_id: WorkshopTopTab;
  title: string;
  tagline: string;
  description: string;
  duration: string | null;
  price: number;
  price_label: string;
  additional_note: string | null;
  image_url: string;
  is_visible: boolean;
  sort_order: number;
  time_slot: string | null;
  includes: string[];
  add_ons: string[];
  firing_note: string | null;
  message_card: string | null;
  status_text: string | null;
};

export type CatalogOneTimeExperience = {
  id: OneTimeExperienceId;
  title: string;
  tagline: string;
  description: string;
  duration: string;
  price: number;
  priceLabel: string;
  additionalNote?: string;
  imageUrl: string;
};

export type CatalogDateNight = {
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  time: string;
  price: number;
  priceLabel: string;
  slot: string;
  includes: string[];
  addOns: string[];
  firingNote: string;
  messageCard: string;
};

export type CatalogPrivateParty = {
  title: string;
  tagline: string;
  description: string;
  imageUrl: string;
  duration: string;
  price: number;
  priceLabel: string;
  additionalNote?: string;
  includes: string[];
  addOns: string[];
};

export type CatalogCourses = {
  title: string;
  description: string;
  status: string;
};

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  return [];
}

function staticFallback(): {
  tabs: WorkshopTabRecord[];
  experiences: WorkshopExperienceRecord[];
} {
  const tabs: WorkshopTabRecord[] = TOP_WORKSHOP_TABS.map((t, i) => ({
    id: t.id,
    label: t.label,
    tagline: t.tagline,
    is_visible: true,
    sort_order: i + 1,
  }));

  const experiences: WorkshopExperienceRecord[] = [
    ...ONE_TIME_EXPERIENCES.map((e, i) => ({
      id: e.id,
      tab_id: "one-time" as const,
      title: e.title,
      tagline: e.tagline,
      description: e.description,
      duration: e.duration,
      price: e.price,
      price_label: e.priceLabel,
      additional_note: e.additionalNote ?? null,
      image_url: e.imageUrl,
      is_visible: !PAUSED_ONE_TIME_EXPERIENCE_IDS.includes(e.id),
      sort_order: i + 1,
      time_slot: null,
      includes: [],
      add_ons: [],
      firing_note: null,
      message_card: null,
      status_text: null,
    })),
    {
      id: "date-night",
      tab_id: "date-night",
      title: DATE_NIGHT.title,
      tagline: DATE_NIGHT.tagline,
      description: DATE_NIGHT.description,
      duration: null,
      price: DATE_NIGHT.price,
      price_label: DATE_NIGHT.priceLabel,
      additional_note: null,
      image_url: DATE_NIGHT.imageUrl,
      is_visible: true,
      sort_order: 1,
      time_slot: DATE_NIGHT.time,
      includes: DATE_NIGHT.includes,
      add_ons: DATE_NIGHT.addOns,
      firing_note: DATE_NIGHT.firingNote,
      message_card: DATE_NIGHT.messageCard,
      status_text: null,
    },
    {
      id: "private-clay-parties",
      tab_id: "private-parties",
      title: PRIVATE_CLAY_PARTY.title,
      tagline: PRIVATE_CLAY_PARTY.tagline,
      description: PRIVATE_CLAY_PARTY.description,
      duration: PRIVATE_CLAY_PARTY.duration,
      price: PRIVATE_CLAY_PARTY.price,
      price_label: PRIVATE_CLAY_PARTY.priceLabel,
      additional_note: PRIVATE_CLAY_PARTY.additionalNote ?? null,
      image_url: PRIVATE_CLAY_PARTY.imageUrl,
      is_visible: true,
      sort_order: 1,
      time_slot: null,
      includes: PRIVATE_CLAY_PARTY.includes,
      add_ons: PRIVATE_CLAY_PARTY.addOns,
      firing_note: null,
      message_card: null,
      status_text: null,
    },
    {
      id: "courses-main",
      tab_id: "courses",
      title: COURSES.title,
      tagline: "",
      description: COURSES.description,
      duration: null,
      price: 0,
      price_label: "",
      additional_note: null,
      image_url: "",
      is_visible: true,
      sort_order: 1,
      time_slot: null,
      includes: [],
      add_ons: [],
      firing_note: null,
      message_card: null,
      status_text: COURSES.status,
    },
  ];

  return { tabs, experiences };
}

function mapExperienceRow(row: Record<string, unknown>): WorkshopExperienceRecord {
  return {
    id: String(row.id),
    tab_id: row.tab_id as WorkshopTopTab,
    title: String(row.title),
    tagline: String(row.tagline ?? ""),
    description: String(row.description ?? ""),
    duration: row.duration ? String(row.duration) : null,
    price: Number(row.price),
    price_label: String(row.price_label ?? ""),
    additional_note: row.additional_note ? String(row.additional_note) : null,
    image_url: String(row.image_url ?? ""),
    is_visible: row.is_visible !== false,
    sort_order: Number(row.sort_order ?? 0),
    time_slot: row.time_slot ? String(row.time_slot) : null,
    includes: parseJsonArray(row.includes),
    add_ons: parseJsonArray(row.add_ons),
    firing_note: row.firing_note ? String(row.firing_note) : null,
    message_card: row.message_card ? String(row.message_card) : null,
    status_text: row.status_text ? String(row.status_text) : null,
  };
}

export const useWorkshopCatalog = (options?: { includeHidden?: boolean }) => {
  const includeHidden = options?.includeHidden ?? false;
  const [tabs, setTabs] = useState<WorkshopTabRecord[]>([]);
  const [experiences, setExperiences] = useState<WorkshopExperienceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tabsRes, expRes] = await Promise.all([
        supabase.from("workshop_tabs").select("*").order("sort_order"),
        supabase.from("workshop_experiences").select("*").order("sort_order"),
      ]);

      if (tabsRes.error) throw tabsRes.error;
      if (expRes.error) throw expRes.error;

      const fallback = staticFallback();

      if ((tabsRes.data?.length ?? 0) === 0) {
        setTabs(fallback.tabs);
        setExperiences(fallback.experiences);
        return;
      }

      const tabsFromDb = (tabsRes.data ?? []).map((row) => ({
        id: row.id as WorkshopTopTab,
        label: row.label,
        tagline: row.tagline,
        is_visible: row.is_visible,
        sort_order: row.sort_order,
      }));
      const experiencesFromDb = (expRes.data ?? []).map(mapExperienceRow);

      const tabIds = new Set(tabsFromDb.map((tab) => tab.id));
      const experienceIds = new Set(experiencesFromDb.map((exp) => exp.id));
      const extraTabs = fallback.tabs.filter((tab) => !tabIds.has(tab.id));

      setTabs(
        [...tabsFromDb, ...extraTabs].map((tab) =>
          extraTabs.some((extra) => extra.id === "private-parties") && tab.id === "courses"
            ? { ...tab, sort_order: Math.max(tab.sort_order, 4) }
            : tab,
        ),
      );
      setExperiences([
        ...experiencesFromDb,
        ...fallback.experiences.filter((exp) => !experienceIds.has(exp.id)),
      ]);
    } catch {
      const fallback = staticFallback();
      setTabs(fallback.tabs);
      setExperiences(fallback.experiences);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visibleTabs = useMemo(
    () =>
      tabs
        .filter((t) => includeHidden || t.is_visible)
        .sort((a, b) => a.sort_order - b.sort_order),
    [tabs, includeHidden],
  );

  const getExperiencesForTab = useCallback(
    (tabId: WorkshopTopTab) =>
      experiences
        .filter((e) => e.tab_id === tabId && (includeHidden || e.is_visible))
        .sort((a, b) => a.sort_order - b.sort_order),
    [experiences, includeHidden],
  );

  const oneTimeExperiences: CatalogOneTimeExperience[] = useMemo(
    () =>
      getExperiencesForTab("one-time")
        .filter(
          (e) =>
            includeHidden ||
            !PAUSED_ONE_TIME_EXPERIENCE_IDS.includes(e.id as OneTimeExperienceId),
        )
        .map((e) => ({
          id: e.id as OneTimeExperienceId,
          title: e.title,
          tagline: e.tagline,
          description: e.description,
          duration: e.duration ?? "",
          price: e.price,
          priceLabel: e.price_label,
          additionalNote: e.additional_note ?? undefined,
          imageUrl: e.image_url,
        })),
    [getExperiencesForTab, includeHidden],
  );

  const dateNight: CatalogDateNight | null = useMemo(() => {
    const e = getExperiencesForTab("date-night")[0];
    if (!e) return null;
    return {
      title: e.title,
      tagline: e.tagline,
      description: e.description,
      imageUrl: e.image_url,
      time: e.time_slot ?? "",
      price: e.price,
      priceLabel: e.price_label,
      slot: e.time_slot ?? "",
      includes: e.includes,
      addOns: e.add_ons,
      firingNote: e.firing_note ?? "",
      messageCard: e.message_card ?? "",
    };
  }, [getExperiencesForTab]);

  const privateParty: CatalogPrivateParty | null = useMemo(() => {
    const e = getExperiencesForTab("private-parties")[0];
    if (!e) return null;
    return {
      title: e.title,
      tagline: e.tagline,
      description: e.description,
      imageUrl: e.image_url,
      duration: e.duration ?? "2 Hours",
      price: e.price,
      priceLabel: e.price_label,
      additionalNote: e.additional_note ?? undefined,
      includes: e.includes,
      addOns: e.add_ons,
    };
  }, [getExperiencesForTab]);

  const courses: CatalogCourses | null = useMemo(() => {
    const e = getExperiencesForTab("courses")[0];
    if (!e) return null;
    return {
      title: e.title,
      description: e.description,
      status: e.status_text ?? "Coming Soon.",
    };
  }, [getExperiencesForTab]);

  const getExperienceById = useCallback(
    (id: string) => experiences.find((e) => e.id === id),
    [experiences],
  );

  const getScheduleId = (experienceId: string): WorkshopScheduleId | null => {
    if (
      experienceId === "paint-your-own-pot" ||
      experienceId === "handbuilding-ceramics" ||
      experienceId === "wheel-throwing" ||
      experienceId === "date-night" ||
      experienceId === "private-clay-parties"
    ) {
      return experienceId;
    }
    return null;
  };

  return {
    loading,
    tabs: visibleTabs,
    allTabs: tabs,
    allExperiences: experiences,
    oneTimeExperiences,
    dateNight,
    privateParty,
    courses,
    getExperiencesForTab,
    getExperienceById,
    getScheduleId,
    refresh: load,
  };
};
