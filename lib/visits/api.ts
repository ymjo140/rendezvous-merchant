export class VisitApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type VisitRequest = {
  id: string; name: string; community_id: string | null; verification_code: string;
  created_at: string; expires_at: string;
};
export type QueueResponse = {
  store: { id: number; name: string }; server_time: string; items: VisitRequest[];
};
export type QrResponse = { token: string; checkin_path: string; server_time: string; expires_at: string };
export type ApprovalResponse = {
  id: string; status: "pending" | "verified"; already: boolean;
  participant_count: number; required_participants: number;
};

// Only this API's validated Supabase session token is accepted. No legacy token fallback.
export async function visitApi<T>(path: string, token: string, signal: AbortSignal, method = "GET", body?: unknown): Promise<T> {
  const base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
  if (!base) throw new VisitApiError(503, "방문 확인 서버에 연결할 수 없어요. 운영자에게 문의해주세요.");
  if (!token) throw new VisitApiError(401, "다시 로그인해주세요.");
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) abort();
  const timer = setTimeout(abort, 15000);
  try {
    const response = await fetch(`${base}${path}`, {
      method, signal: controller.signal, cache: "no-store", credentials: "omit",
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw new VisitApiError(response.status, "요청을 처리하지 못했어요.");
    const value: T = await response.json();
    return value;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", abort);
  }
}

export function remainingMs(serverTime: string, expiresAt: string, elapsed: number) {
  const duration = Date.parse(expiresAt) - Date.parse(serverTime);
  if (!Number.isFinite(duration) || duration < 0 || elapsed < 0) throw new Error("Invalid response clock");
  // Subtract the whole round trip and a small safety margin. Device wall-clock skew is irrelevant.
  return Math.max(0, duration - elapsed - 2000);
}

export function liveQrUrl(qr: QrResponse, storeId: string, origin: string) {
  const url = new URL(origin);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.username || url.password
      || url.pathname !== "/" || url.search || url.hash || !/^[1-9]\d*$/.test(storeId)
      || typeof qr.token !== "string" || !qr.token || qr.token.length > 4096
      || qr.checkin_path !== `/checkin/${storeId}#qr=${qr.token}`) {
    throw new Error("Invalid check-in URL");
  }
  return `${url.origin}${qr.checkin_path}`;
}
