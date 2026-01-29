export type StoredRule = {
  id: string | number;
  name: string;
  enabled: boolean;
  days: boolean[];
  timeBlocks: Array<{ start: string; end: string }>;
  partySize?: { min?: number; max?: number };
  leadTime?: { min?: number; max?: number };
  benefit?: { title?: string };
};

const KEY_PREFIX = "rendezvous_rules_";

function getKey(storeId?: string) {
  return `${KEY_PREFIX}${storeId ?? "default"}`;
}

export function loadRules(storeId?: string): StoredRule[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredRule[]) : null;
  } catch {
    return null;
  }
}

export function saveRules(storeId: string | undefined, rules: StoredRule[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(storeId), JSON.stringify(rules));
  } catch {
    // ignore storage failures
  }
}