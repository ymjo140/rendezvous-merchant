export const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.text()) as T;
}

export async function fetchWithAuth<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = options;
  // 살아있는 Supabase 세션에서 신선한 access_token 우선 사용(localStorage 박제본은 만료됨).
  // → FastAPI 경유 호출(예약 상태변경 등)이 토큰 만료로 401 나던 문제 해결.
  let resolvedToken = token ?? null;
  if (!resolvedToken) {
    try {
      const { supabase } = await import("@/lib/supabase/client");
      const { data } = await supabase.auth.getSession();
      resolvedToken = data.session?.access_token ?? null;
    } catch {
      /* Supabase 미구성 등 — 아래 폴백 */
    }
  }
  if (!resolvedToken) {
    resolvedToken = (await import("@/lib/auth/tokenStore")).getToken();
  }

  const response = await fetch(`${baseURL}${path}`, {
    ...rest,
    headers: {
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
      "Content-Type": "application/json",
      ...headers,
    },
    cache: "no-store",
  });

  // 주의: 401이라고 무조건 토큰 삭제 + /login 강제이동하지 않는다.
  // 머천트는 Supabase Auth로 로그인하는데, /api/users/me(FastAPI)는 supabase 토큰을
  // 디코드 못 해 401을 주므로, 여기서 강제 로그아웃하면 정상 세션이 로그인 직후 튕긴다.
  // 401은 아래에서 ApiError로 던지고, 호출자(useMe 등)가 적절히 처리한다.

  const payload = await parseResponse<T | { message?: string }>(response);

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload && payload.message
        ? String(payload.message)
        : `Request failed (${response.status})`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}


