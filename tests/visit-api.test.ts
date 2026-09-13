import { describe, expect, it } from "vitest";
import { liveQrUrl, remainingMs } from "@/lib/visits/api";

const qr = { token: "signed-proof", checkin_path: "/checkin/42#qr=signed-proof", server_time: "2026-09-12T03:00:00Z", expires_at: "2026-09-12T03:03:00Z" };
describe("QR contract", () => {
  it("keeps the proof exclusively in the fragment of the configured guest app", () => {
    const value = new URL(liveQrUrl(qr, "42", "https://guest.example.invalid"));
    expect(value.origin).toBe("https://guest.example.invalid");
    expect(value.pathname).toBe("/checkin/42");
    expect(value.search).toBe("");
    expect(value.hash).toBe("#qr=signed-proof");
  });
  it.each(["https://evil.invalid/checkin/42#qr=signed-proof", "//evil.invalid/#qr=signed-proof", "/checkin/43#qr=signed-proof", "/checkin/42?qr=signed-proof"])("rejects an unexpected QR path: %s", path => {
    expect(() => liveQrUrl({ ...qr, checkin_path: path }, "42", "https://guest.example.invalid")).toThrow();
  });
  it.each(["javascript:alert(1)", "http://guest.example.invalid", "https://user:password@guest.example.invalid", "https://guest.example.invalid/another-app"])("rejects an unsafe guest origin: %s", origin => {
    expect(() => liveQrUrl(qr, "42", origin)).toThrow();
  });
  it("accounts for transit time and rejects invalid clocks", () => {
    expect(remainingMs(qr.server_time, qr.expires_at, 10000)).toBe(168000);
    expect(remainingMs(qr.server_time, qr.expires_at, 200000)).toBe(0);
    expect(() => remainingMs("invalid", qr.expires_at, 0)).toThrow();
  });
});
