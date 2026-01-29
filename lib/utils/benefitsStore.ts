import { BenefitCategory, BenefitType } from "@/domain/offers/types";

export type StoredBenefit = {
  id: number | string;
  title: string;
  category: BenefitCategory;
  type: BenefitType;
  value?: string;
  active: boolean;
};

const KEY_PREFIX = "rendezvous_benefits_";

function getKey(storeId?: string) {
  return `${KEY_PREFIX}${storeId ?? "default"}`;
}

export function loadBenefits(storeId?: string): StoredBenefit[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredBenefit[]) : null;
  } catch {
    return null;
  }
}

export function saveBenefits(storeId: string | undefined, benefits: StoredBenefit[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(storeId), JSON.stringify(benefits));
  } catch {
    // ignore storage failures
  }
}