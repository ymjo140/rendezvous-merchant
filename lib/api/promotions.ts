import { apiRequest } from "@/lib/api-client";
import type { Promotion, OfferRulePayload } from "@/types/promotion";

export async function getActivePromotions(storeId: string) {
  return apiRequest<Promotion[]>(`/promotions?storeId=${storeId}`);
}

export async function createPromotion(data: OfferRulePayload) {
  return apiRequest<Promotion>("/promotions", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
