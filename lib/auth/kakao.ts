import { fetchWithAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export type KakaoExchangeResponse = {
  access_token: string;
  refresh_token?: string;
};

export async function exchangeKakaoCode(code: string) {
  return fetchWithAuth<KakaoExchangeResponse>(endpoints.kakaoExchange, {
    method: "POST",
    body: JSON.stringify({ code }),
  });
}


