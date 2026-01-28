import type { StoreSummary } from "@/domain/stores/types";

export function getPrimaryStore(stores: StoreSummary[]) {
  return stores[0];
}


