import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/hooks/useProducts";
import { isWorkshopProduct } from "@/config/workshops";

export const useProduct = (productId?: string) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setError("Product not found");
      return;
    }

    const id = parseInt(productId, 10);
    if (Number.isNaN(id)) {
      setLoading(false);
      setError("Invalid product");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("products")
          .select("*")
          .eq("id", id)
          .eq("is_active", true)
          .maybeSingle();

        if (fetchError) throw fetchError;
        if (!data || isWorkshopProduct(data)) {
          setProduct(null);
          setRelatedProducts([]);
          setError("Product not found");
          return;
        }

        setProduct(data as Product);

        const isTemplate = data.is_template === true;
        let relatedQuery = supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .eq("is_template", isTemplate)
          .eq("is_workshop", false)
          .neq("id", id)
          .order("created_at", { ascending: true })
          .limit(12);

        if (!isTemplate) {
          relatedQuery = relatedQuery.eq("category", data.category);
        }

        const { data: related, error: relatedError } = await relatedQuery;

        if (relatedError) throw relatedError;
        setRelatedProducts((related as Product[]) || []);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load product";
        setError(message);
        setProduct(null);
        setRelatedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [productId]);

  return { product, relatedProducts, loading, error };
};
