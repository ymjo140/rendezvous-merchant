import { type StoredBenefit } from "@/lib/utils/benefitsStore";

export type StoredTimeDeal = {
  id: string;
  benefitId: StoredBenefit["id"];
  title: string;
  date: string;
  start_time: string;
  end_time: string;
};

const KEY_PREFIX = "rendezvous_time_deals_";

function getKey(storeId?: string) {
  return `${KEY_PREFIX}${storeId ?? "default"}`;
}

export function loadTimeDeals(storeId?: string): StoredTimeDeal[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredTimeDeal[]) : null;
  } catch {
    return null;
  }
}

export function saveTimeDeals(storeId: string | undefined, deals: StoredTimeDeal[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(storeId), JSON.stringify(deals));
  } catch {
    // ignore storage failures
  }
}
