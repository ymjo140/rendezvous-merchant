"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import type { OccupancySnapshot } from "@/domain/offers/yieldEngine";

// 테이블 맵 점유 스냅샷(store_table_events) — AI 수익엔진의 실측 점유율 입력.

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useTableSnapshots(storeId?: string) {
  return useQuery({
    queryKey: ["table-snapshots", storeId],
    queryFn: async () => {
      if (!storeId || !isSupabaseConfigured) return [] as OccupancySnapshot[];
      const placeId = Number(storeId);
      if (!Number.isFinite(placeId)) return [] as OccupancySnapshot[];
      const { data, error } = await supabase
        .from("store_table_events")
        .select("occupied_seats, total_seats, created_at")
        .eq("place_id", placeId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) return [] as OccupancySnapshot[];
      return (data ?? [])
        .filter((r: any) => r.total_seats > 0)
        .map((r: any) => ({
          ts: r.created_at,
          occupancy: r.occupied_seats / r.total_seats,
        })) as OccupancySnapshot[];
    },
    staleTime: 60 * 1000,
  });
}
