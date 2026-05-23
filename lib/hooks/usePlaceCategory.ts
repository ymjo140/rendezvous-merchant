import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

/**
 * storeId(=place id)로 해당 장소의 main_category 조회.
 * Yield 엔진의 업종별 수요 기준선에 사용. RLS 등으로 막히면 undefined(→ DEFAULT 기준선).
 */
export function usePlaceCategory(storeId?: string) {
  return useQuery({
    queryKey: ["place-category", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const placeId = Number(storeId);
      if (!Number.isFinite(placeId)) return undefined;
      const { data } = await supabase
        .from("places")
        .select("main_category")
        .eq("id", placeId)
        .maybeSingle();
      return (data?.main_category as string | undefined) ?? undefined;
    },
  });
}
