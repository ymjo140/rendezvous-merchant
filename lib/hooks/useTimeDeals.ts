import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type TimeDealRow = {
  id: string;
  store_id: string;
  benefit_id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchTimeDeals(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as TimeDealRow[];
  const { data, error } = await supabase
    .from("time_deals")
    .select("*")
    .eq("store_id", storeId)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TimeDealRow[];
}

export function useTimeDeals(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["time-deals", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTimeDeals(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`time-deals-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "time_deals",
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

  const createTimeDeal = useMutation({
    mutationFn: async (payload: TimeDealRow) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase.from("time_deals").insert(payload);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TimeDealRow[]>(queryKey) ?? [];
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

  const updateTimeDeal = useMutation({
    mutationFn: async (payload: Partial<TimeDealRow> & { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("time_deals")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TimeDealRow[]>(queryKey) ?? [];
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

  const deleteTimeDeal = useMutation({
    mutationFn: async (payload: { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("time_deals")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TimeDealRow[]>(queryKey) ?? [];
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
    createTimeDeal,
    updateTimeDeal,
    deleteTimeDeal,
    isSupabaseConfigured,
  };
}
