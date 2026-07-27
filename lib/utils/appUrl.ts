// 손님 앱(B2C) 주소 — 체크인 QR·미리보기 링크가 실제로 열려야 하므로 한 곳에서 관리.
// 배포마다 도메인이 달라지면 NEXT_PUBLIC_B2C_URL만 바꾸면 된다.
//
// 폴백은 '지금 실제로 열리는 주소'여야 한다. 아직 없는 도메인을 적어두면
// env 설정을 잊은 순간 QR이 아무 데도 가지 않고, 인쇄물은 되돌릴 수 없다.
// rendezvous.kr을 구입하면 여기를 바꾸거나 env를 넣으면 된다.
const FALLBACK = "https://rendezvous-kr.vercel.app";

export function b2cOrigin(): string {
  const env = (process.env.NEXT_PUBLIC_B2C_URL || "").trim();
  return (env || FALLBACK).replace(/\/$/, "");
}

export function checkinUrl(storeId: string | number | undefined): string {
  return `${b2cOrigin()}/checkin/${storeId ?? ""}`;
}
