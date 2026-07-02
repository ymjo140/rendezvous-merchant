"use client";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

// 테이블 맵(store_tables) 조회 — 수용량(table_units)을 대체하는 좌석 SSOT.
// AI 수익엔진 등의 좌석수 입력으로 사용. 테이블맵 미등록 매장은 호출부에서
// table_units로 폴백한다.

export type StoreTableRow = {
  id: number;
  place_id: number;
  label: string;
  capacity: number;
  shape: string;
  zone_type: string;
  status: string;
  deal_percent: number | null;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function useStoreTables(storeId?: string) {
  return useQuery({
    queryKey: ["store-tables", storeId],
    queryFn: async () => {
      if (!storeId || !isSupabaseConfigured) return [] as StoreTableRow[];
      const placeId = Number(storeId);
      if (!Number.isFinite(placeId)) return [] as StoreTableRow[];
      const { data, error } = await supabase
        .from("store_tables")
        .select("id, place_id, label, capacity, shape, zone_type, status, deal_percent")
        .eq("place_id", placeId);
      if (error) return [] as StoreTableRow[];
      return (data ?? []) as StoreTableRow[];
    },
    staleTime: 30 * 1000,
  });
}
