import { useQuery } from "@tanstack/react-query";
import { getActivePromotions } from "@/lib/api/promotions";

export function usePromotions(storeId?: string) {
  return useQuery({
    queryKey: ["promotions", storeId],
    queryFn: () => getActivePromotions(storeId as string),
    enabled: Boolean(storeId),
  });
}
