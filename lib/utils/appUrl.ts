// 손님 앱(B2C) 주소 — 체크인 QR·미리보기 링크가 실제로 열려야 하므로 한 곳에서 관리.
// 배포마다 도메인이 달라지면 NEXT_PUBLIC_B2C_URL만 바꾸면 된다.
const FALLBACK = "https://rendezvous.kr";

export function b2cOrigin(): string {
  const env = (process.env.NEXT_PUBLIC_B2C_URL || "").trim();
  return (env || FALLBACK).replace(/\/$/, "");
}

export function checkinUrl(storeId: string | number | undefined): string {
  return `${b2cOrigin()}/checkin/${storeId ?? ""}`;
}
