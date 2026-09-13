import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { VisitDeskPage } from "@/components/pages/VisitDeskPage";

const auth = vi.hoisted(() => ({
  session: null as Session | null,
  listeners: new Set<(event: AuthChangeEvent, session: Session | null) => void>(),
  getSession: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({ supabase: { auth: {
  getSession: auth.getSession,
  onAuthStateChange: (listener: (event: AuthChangeEvent, session: Session | null) => void) => {
    auth.listeners.add(listener);
    return { data: { subscription: { unsubscribe: () => auth.listeners.delete(listener) } } };
  },
} } }));

const serverStart = Date.parse("2026-09-12T03:00:00Z");
const stamp = (offset = 0) => new Date(serverStart + performance.now() + offset).toISOString();
const qr = (id: string) => ({ token: `proof-${id}`, checkin_path: `/checkin/${id}#qr=proof-${id}`, server_time: stamp(), expires_at: stamp(180000) });
const guest = (id = "1", expires = stamp(900000)) => ({
  id: `abcdef12-${id}`, name: `손님 ${id}`, community_id: "crew", verification_code: "ABCDEF12",
  created_at: stamp(), expires_at: expires,
});
const queue = (id = "1", items = [guest(id)]) => ({ store: { id: Number(id), name: `가게 ${id}` }, server_time: stamp(), items });
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
};
const calls: { path: string; init: RequestInit }[] = [];
let handler: (path: string, init: RequestInit) => Promise<Response>;
const defaults = async (path: string) => {
  const id = path.match(/stores\/(\d+)\//)?.[1] ?? "1";
  return response(path.endsWith("checkin-qr") ? qr(id) : queue(id));
};
const settle = async () => { await act(async () => { await Promise.resolve(); }); };
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
async function mount(id = "1") {
  const view = render(<VisitDeskPage storeId={id} />);
  await settle();
  return view;
}
const emit = (event: AuthChangeEvent, session: Session | null) => {
  auth.session = session;
  act(() => { auth.listeners.forEach(listener => listener(event, session)); });
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date", "performance"] });
  vi.setSystemTime("2026-09-12T12:00:00Z"); // Device is nine hours ahead of the server.
  vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.invalid");
  vi.stubEnv("NEXT_PUBLIC_B2C_URL", "https://guest.example.invalid");
  Object.defineProperty(document, "hidden", { configurable: true, value: false });
  auth.session = { access_token: "fresh-token", refresh_token: "refresh", token_type: "bearer", expires_in: 3600,
    user: { id: "merchant-1", aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: stamp() } };
  auth.getSession.mockReset().mockImplementation(async () => ({ data: { session: auth.session }, error: null }));
  handler = defaults; calls.length = 0;
  vi.stubGlobal("fetch", vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname; calls.push({ path, init }); return handler(path, init);
  }));
});
afterEach(() => {
  cleanup(); auth.listeners.clear(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals();
});

describe("현장 방문 확인", () => {
  it("shows a valid QR and matching code despite device clock skew; rotates at two minutes", async () => {
    await mount();
    expect(screen.getByRole("img", { name: "방문 인증 QR" })).toBeTruthy();
    expect(screen.getByText("표시 가능 시간 2:58")).toBeTruthy();
    expect(screen.getByText("ABCDEF12")).toBeTruthy();
    expect(calls.every(call => (call.init.headers as Record<string, string>).Authorization === "Bearer fresh-token")).toBe(true);
    expect(calls.every(call => call.init.cache === "no-store")).toBe(true);
    await advance(120000);
    expect(calls.filter(call => call.path.endsWith("checkin-qr"))).toHaveLength(2);
    expect(screen.getByRole("img", { name: "방문 인증 QR" })).toBeTruthy();
  });

  it("hides the QR when renewal fails and does not treat a failed queue as empty", async () => {
    await mount();
    handler = async () => response({ detail: "offline" }, 503);
    fireEvent.click(screen.getByRole("button", { name: "새 QR 발급" }));
    fireEvent.click(screen.getByRole("button", { name: "목록 새로고침" }));
    await settle();
    expect(screen.queryByRole("img", { name: "방문 인증 QR" })).toBeNull();
    expect(screen.getByText(/대기 목록을 확인하지 못했어요/)).toBeTruthy();
    expect(screen.queryByText(/지금 확인을 기다리는 손님이 없어요/)).toBeNull();
    handler = defaults;
    fireEvent.click(screen.getByRole("button", { name: "목록 새로고침" }));
    await settle();
    expect(screen.getByText("손님 1")).toBeTruthy();
  });

  it("discards late responses from the previous store", async () => {
    const old = deferred<Response>();
    handler = path => path.includes("stores/1/") ? old.promise : defaults(path);
    const view = await mount();
    view.rerender(<VisitDeskPage storeId="2" />);
    expect(screen.queryByText("손님 1")).toBeNull();
    await settle();
    expect(screen.getByText("가게 2")).toBeTruthy();
    const encoded = screen.getByRole("img", { name: "방문 인증 QR" }).innerHTML;
    old.resolve(response(qr("1"))); await settle();
    expect(screen.getByRole("img", { name: "방문 인증 QR" }).innerHTML).toBe(encoded);
    expect(screen.queryByText("손님 1")).toBeNull();
  });

  it.each([401, 403])("clears both surfaces after an authorization failure (%s)", async status => {
    await mount();
    handler = async () => response({}, status);
    await advance(6000);
    expect(screen.queryByRole("img", { name: "방문 인증 QR" })).toBeNull();
    expect(screen.queryByText("손님 1")).toBeNull();
    expect(screen.getByRole("alert")).toBeTruthy();
    const count = calls.length;
    await advance(20000);
    expect(calls).toHaveLength(count);
  });

  it("clears immediately on sign-out and ignores a late initial session", async () => {
    const delayed = deferred<{ data: { session: Session | null }; error: null }>();
    auth.getSession.mockReturnValue(delayed.promise);
    await mount();
    const session = auth.session;
    emit("SIGNED_OUT", null);
    delayed.resolve({ data: { session }, error: null }); await settle();
    expect(calls).toHaveLength(0);
    expect(screen.getByRole("link", { name: "로그인하기" })).toBeTruthy();
  });

  it("clears legacy logout and account changes instead of retaining the prior user's view", async () => {
    const view = await mount();
    emit("SIGNED_IN", { ...auth.session!, user: { ...auth.session!.user, id: "merchant-2" } });
    expect(screen.queryByRole("img", { name: "방문 인증 QR" })).toBeNull();
    view.unmount();
    await mount();
    act(() => { window.dispatchEvent(new Event("merchant:sign-out")); });
    expect(screen.queryByText("손님 1")).toBeNull();
    expect(screen.getByRole("link", { name: "로그인하기" })).toBeTruthy();
  });

  it("pauses while hidden and fetches a new QR on return", async () => {
    await mount();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));
    expect(screen.queryByRole("img", { name: "방문 인증 QR" })).toBeNull();
    const count = calls.length; await advance(200000);
    expect(calls).toHaveLength(count);
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    fireEvent(document, new Event("visibilitychange")); await settle();
    expect(calls.filter(call => call.path.endsWith("checkin-qr"))).toHaveLength(2);
    expect(screen.getByRole("img", { name: "방문 인증 QR" })).toBeTruthy();
  });

  it("uses refreshed session tokens on subsequent requests", async () => {
    await mount();
    emit("TOKEN_REFRESHED", { ...auth.session!, access_token: "new-token" });
    await advance(6000);
    const latest = calls.at(-1)!;
    expect((latest.init.headers as Record<string, string>).Authorization).toBe("Bearer new-token");
  });

  it("requires physical confirmation, blocks duplicate clicks, and removes the completed request", async () => {
    const approved = deferred<Response>();
    let completed = false;
    handler = async path => {
      if (path.endsWith("/approve")) return approved.promise;
      if (path.endsWith("visit-requests")) return response(queue("1", completed ? [] : [guest()]));
      return defaults(path);
    };
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "이 손님 확인" }));
    const approve = screen.getByRole("button", { name: "방문 승인" }) as HTMLButtonElement;
    expect(approve.disabled).toBe(true);
    fireEvent.click(screen.getByRole("checkbox"));
    act(() => { fireEvent.click(approve); fireEvent.click(approve); });
    expect(calls.filter(call => call.path.endsWith("/approve"))).toHaveLength(1);
    const approvalCall = calls.find(call => call.path.endsWith("/approve"))!;
    expect(JSON.parse(approvalCall.init.body as string)).toHaveProperty("expected_created_at");
    completed = true;
    approved.resolve(response({ id: "visit", status: "pending", already: false, participant_count: 1, required_participants: 2 }));
    await settle();
    expect(screen.getByText(/공동 방문은 다른 크루 멤버의 확인을 기다리고/)).toBeTruthy();
    expect(screen.getByText(/지금 확인을 기다리는 손님이 없어요/)).toBeTruthy();
  });

  it("removes an expired selected request and does not approve it", async () => {
    handler = async path => path.endsWith("visit-requests") ? response(queue("1", [guest("1", new Date(serverStart + 5000).toISOString())])) : defaults(path);
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "이 손님 확인" }));
    fireEvent.click(screen.getByRole("checkbox"));
    await advance(3000);
    expect(screen.queryByRole("button", { name: "방문 승인" })).toBeNull();
    expect(calls.filter(call => call.path.endsWith("/approve"))).toHaveLength(0);
  });

  it("requires a new physical confirmation when a request is renewed with the same ID", async () => {
    let item = guest();
    handler = async path => path.endsWith("visit-requests") ? response(queue("1", [item])) : defaults(path);
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "이 손님 확인" }));
    fireEvent.click(screen.getByRole("checkbox"));
    item = { ...item, created_at: stamp(1000), expires_at: stamp(901000) };
    fireEvent.click(screen.getByRole("button", { name: "목록 새로고침" })); await settle();
    expect(screen.queryByRole("button", { name: "방문 승인" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "이 손님 확인" }));
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });

  it("shows an uncertain outcome on timeout and never automatically retries approval", async () => {
    handler = async (path, init) => {
      if (path.endsWith("/approve")) return new Promise((_resolve, reject) => init.signal!.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError"))));
      return defaults(path);
    };
    await mount();
    fireEvent.click(screen.getByRole("button", { name: "이 손님 확인" }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "방문 승인" }));
    await advance(20000);
    expect(screen.getByText(/처리 결과를 확인하지 못했어요/)).toBeTruthy();
    expect(calls.filter(call => call.path.endsWith("/approve"))).toHaveLength(1);
  });
});
