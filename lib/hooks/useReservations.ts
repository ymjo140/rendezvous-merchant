import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type ReservationRow = {
  id: string;
  store_id: string;
  guest_name: string;
  party_size: number;
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show" | "blocked";
  unit_id: string;
  unit_index: number;
  start_time: string;
  end_time: string;
  source?: "internal" | "external" | "manual";
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchReservations(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as ReservationRow[];
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("store_id", storeId)
    .order("start_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReservationRow[];
}

export function useReservations(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["reservations", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchReservations(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`reservations-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservations",
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

  const createReservation = useMutation({
    mutationFn: async (payload: ReservationRow) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase.from("reservations").insert(payload);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ReservationRow[]>(queryKey) ?? [];
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

  const updateReservation = useMutation({
    mutationFn: async (payload: Partial<ReservationRow> & { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("reservations")
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
      const previous = queryClient.getQueryData<ReservationRow[]>(queryKey) ?? [];
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

  const deleteReservation = useMutation({
    mutationFn: async (payload: { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("reservations")
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
      const previous = queryClient.getQueryData<ReservationRow[]>(queryKey) ?? [];
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
    createReservation,
    updateReservation,
    deleteReservation,
    isSupabaseConfigured,
  };
}
