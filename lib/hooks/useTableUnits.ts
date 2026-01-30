import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type TableUnitRow = {
  id: string;
  store_id: string;
  name: string;
  min_capacity: number;
  max_capacity: number;
  quantity: number;
  is_private: boolean;
  created_at?: string;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchTableUnits(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as TableUnitRow[];
  const { data, error } = await supabase
    .from("table_units")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as TableUnitRow[];
}

export function useTableUnits(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["table-units", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchTableUnits(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`table-units-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "table_units",
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

  const createUnit = useMutation({
    mutationFn: async (payload: TableUnitRow) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase.from("table_units").insert(payload);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TableUnitRow[]>(queryKey) ?? [];
      queryClient.setQueryData(queryKey, [...previous, payload]);
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

  const updateUnit = useMutation({
    mutationFn: async (payload: Partial<TableUnitRow> & { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("table_units")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<TableUnitRow[]>(queryKey) ?? [];
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

  return {
    ...query,
    createUnit,
    updateUnit,
    isSupabaseConfigured,
  };
}
