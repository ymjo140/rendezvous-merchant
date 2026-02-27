import { apiRequest } from "@/lib/api-client";
import { getToken } from "@/lib/auth/tokenStore";
import type { StoreSummary } from "@/domain/stores/types";

type StoresResponse = {
  stores: StoreSummary[];
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
