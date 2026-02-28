import { apiRequest } from "@/lib/api-client";
import { getToken } from "@/lib/auth/tokenStore";
import type { StoreSummary } from "@/domain/stores/types";

type StoresResponse = {
  stores: StoreSummary[];
};

export type CreateStorePayload = {
  place_id?: string | number;
  name?: string;
  category?: string;
  address?: string;
};

export async function getMerchantStores(): Promise<StoreSummary[]> {
  const token = getToken();
  const response = await apiRequest<StoresResponse | StoreSummary[]>(
    "/api/merchant/stores",
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }
  );

  if (Array.isArray(response)) return response;
  return response?.stores ?? [];
}

export async function createMerchantStore(payload: CreateStorePayload): Promise<StoreSummary> {
  const token = getToken();
  const response = await apiRequest<{ store: StoreSummary } | StoreSummary>(
    "/api/merchant/stores",
    {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify(payload),
    }
  );

  if ("store" in response) return response.store;
  return response as StoreSummary;
}
