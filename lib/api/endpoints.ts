export const endpoints = {
  usersMe: "/api/users/me",
  merchantStores: "/api/merchant/stores",
  offerRules: (storeId: string | number) =>
    `/api/merchant/stores/${storeId}/offer-rules`,
  metrics: (storeId: string | number, from: string, to: string) =>
    `/api/merchant/stores/${storeId}/metrics?from=${from}&to=${to}`,
  benefits: (storeId: string | number) =>
    `/api/merchant/stores/${storeId}/benefits`,
  aiActions: "/api/ai/actions",
  kakaoExchange: "/api/auth/kakao/callback",
};


