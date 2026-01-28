export const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

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
  const resolvedToken = token ?? (await import("@/lib/auth/tokenStore")).getToken();

  const response = await fetch(`${baseURL}${path}`, {
    ...rest,
    headers: {
      ...(resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {}),
      "Content-Type": "application/json",
      ...headers,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    const { clearToken } = await import("@/lib/auth/tokenStore");
    clearToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }

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


