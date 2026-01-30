export type StoredReservation = {
  id: string;
  guestName: string;
  partySize: number;
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show";
  unit_id: string;
  unit_index: number;
  start_time: string;
  end_time: string;
  source?: "internal" | "external";
};

const KEY_PREFIX = "rendezvous_reservations_";

function getKey(storeId?: string) {
  return `${KEY_PREFIX}${storeId ?? "default"}`;
}

export function loadReservations(storeId?: string): StoredReservation[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getKey(storeId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredReservation[]) : null;
  } catch {
    return null;
  }
}

export function saveReservations(
  storeId: string | undefined,
  reservations: StoredReservation[]
) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(getKey(storeId), JSON.stringify(reservations));
  } catch {
    // ignore storage failures
  }
}