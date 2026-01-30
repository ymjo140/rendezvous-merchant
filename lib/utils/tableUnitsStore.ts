import type { TableUnit } from "@/domain/stores/types";

export type StoredTableUnit = TableUnit;

const KEY_PREFIX = "rendezvous_table_units_";

function getKey(storeId?: string) {
  return `${KEY_PREFIX}${storeId ?? "default"}`;
}

export function loadTableUnits(storeId?: string): StoredTableUnit[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredTableUnit[]) : null;
  } catch {
    return null;
  }
}

export function saveTableUnits(storeId: string | undefined, units: StoredTableUnit[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(storeId), JSON.stringify(units));
  } catch {
    // ignore
  }
}