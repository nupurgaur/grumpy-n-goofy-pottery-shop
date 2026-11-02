import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/hooks/useProducts";
import { useToast } from "@/hooks/use-toast";

export const useTemplates = () => {
  const [templates, setTemplates] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .eq("is_template", true)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setTemplates((data as Product[]) || []);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to load templates";
        toast({
          title: "Error loading templates",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  return { templates, loading };
};
