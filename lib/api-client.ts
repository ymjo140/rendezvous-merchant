const DEFAULT_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type ApiErrorDetails = {
  status: number;
  message: string;
  payload?: unknown;
};

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = "ApiError";
    this.status = details.status;
    this.payload = details.payload;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  baseUrl: string = DEFAULT_BASE_URL
): Promise<T> {
  if (!baseUrl) {
    throw new ApiError({
      status: 500,
      message: "NEXT_PUBLIC_API_URL is not configured.",
    });
  }

  const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
  const headers = {
    "Content-Type": "application/json",
    ...(init.headers ?? {}),
  } as Record<string, string>;

  const response = await fetch(url, {
    ...init,
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: string }).message)
        : response.statusText) || "Request failed";
    throw new ApiError({ status: response.status, message, payload });
  }

  return payload as T;
}
