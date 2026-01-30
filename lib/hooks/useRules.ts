import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type RuleRow = {
  id: string;
  store_id: string;
  name: string;
  enabled: boolean;
  days: boolean[];
  time_blocks: Array<{ start: string; end: string }>;
  party_min?: number | null;
  party_max?: number | null;
  lead_min?: number | null;
  lead_max?: number | null;
  benefit_id?: string | null;
  benefit_title?: string | null;
  benefit_type?: string | null;
  benefit_value?: string | null;
  guardrails?: { daily_cap?: number; min_spend?: number } | null;
  visibility?: "public" | "private" | null;
  created_at?: string;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchRules(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as RuleRow[];
  const { data, error } = await supabase
    .from("offer_rules")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as RuleRow[];
}

export function useRules(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["rules", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchRules(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`rules-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offer_rules",
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

  const createRule = useMutation({
    mutationFn: async (payload: RuleRow) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase.from("offer_rules").insert(payload);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RuleRow[]>(queryKey) ?? [];
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

  const updateRule = useMutation({
    mutationFn: async (payload: Partial<RuleRow> & { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("offer_rules")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RuleRow[]>(queryKey) ?? [];
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

  const deleteRule = useMutation({
    mutationFn: async (payload: { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("offer_rules")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RuleRow[]>(queryKey) ?? [];
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
    createRule,
    updateRule,
    deleteRule,
    isSupabaseConfigured,
  };
}
