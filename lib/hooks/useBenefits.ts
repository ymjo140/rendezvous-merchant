import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { BenefitCategory, BenefitType } from "@/domain/offers/types";

export type BenefitRow = {
  id: string;
  store_id: string;
  title: string;
  category: BenefitCategory;
  type: BenefitType;
  value?: string | null;
  is_active: boolean;
  created_at?: string;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchBenefits(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as BenefitRow[];
  const { data, error } = await supabase
    .from("offer_benefits_catalog")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as BenefitRow[];
}

export function useBenefits(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["benefits", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchBenefits(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`benefits-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offer_benefits_catalog",
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);

  const createBenefit = useMutation({
    mutationFn: async (payload: BenefitRow) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("offer_benefits_catalog")
        .insert(payload);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BenefitRow[]>(queryKey) ?? [];
      queryClient.setQueryData(queryKey, [payload, ...previous]);
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateBenefit = useMutation({
    mutationFn: async (payload: Partial<BenefitRow> & { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("offer_benefits_catalog")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BenefitRow[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previous.map((item) =>
          item.id === payload.id ? { ...item, ...payload } : item
        )
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteBenefit = useMutation({
    mutationFn: async (payload: { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("offer_benefits_catalog")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BenefitRow[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previous.filter((item) => item.id !== payload.id)
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    createBenefit,
    updateBenefit,
    deleteBenefit,
    isSupabaseConfigured,
  };
}
