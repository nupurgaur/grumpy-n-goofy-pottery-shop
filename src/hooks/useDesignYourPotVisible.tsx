import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SITE_SETTING_KEYS } from "@/config/siteSettings";

const parseVisible = (value: unknown): boolean => value !== false;

export const useDesignYourPotVisible = () => {
  const [visible, setVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SITE_SETTING_KEYS.designYourPotVisible)
        .maybeSingle();

      if (error) throw error;
      setVisible(parseVisible(data?.value));
    } catch {
      setVisible(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const updateVisible = useCallback(async (next: boolean) => {
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: SITE_SETTING_KEYS.designYourPotVisible,
        value: next,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );

    if (error) throw error;
    setVisible(next);
  }, []);

  return { visible, loading, refresh, updateVisible };
};
