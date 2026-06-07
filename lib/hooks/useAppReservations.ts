import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { fetchWithAuth } from "@/lib/api/client";

// B2C 앱에서 들어온 예약(user_reservations) — 머천트 콘솔 노출용.
// 읽기: Supabase 직접(place_id 필터). 상태변경: FastAPI(/api/reservations/{id}/status)
//  → 취소 시 캐시 환불 로직을 백엔드 단일소스로 처리.

export type AppReservationRow = {
  id: string;
  user_id: number | null;
  place_id: number | null;
  place_name: string;
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  party_size: number;
  deposit_amount: number;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  created_at: string;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchAppReservations(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as AppReservationRow[];
  const placeId = Number(storeId);
  if (!Number.isFinite(placeId)) return [] as AppReservationRow[];
  const { data, error } = await supabase
    .from("user_reservations")
    .select("*")
    .eq("place_id", placeId)
    .order("date", { ascending: true })
    .order("time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as AppReservationRow[];
}

export function useAppReservations(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["app-reservations", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchAppReservations(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
    staleTime: 15 * 1000,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const placeId = Number(storeId);
    const channel = supabase
      .channel(`user_reservations-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_reservations",
          filter: `place_id=eq.${placeId}`,
        },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);

  const setStatus = useMutation({
    mutationFn: async (payload: { id: string; status: AppReservationRow["status"] }) => {
      // FastAPI 경유(취소 시 환불 처리). 실패 시 throw.
      await fetchWithAuth(`/api/reservations/${payload.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status: payload.status }),
      });
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { ...query, setStatus, isSupabaseConfigured };
}
