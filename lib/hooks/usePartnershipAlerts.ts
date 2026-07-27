"use client";

// 🔔 제휴 알림 — 크루가 낸 신청 중 아직 처리 안 한 건수.
// 사장님은 앱 푸시를 못 받으므로 콘솔 사이드바 뱃지가 유일한 알림 채널이다.

import { useQuery } from "@tanstack/react-query";
import { fetchWithAuth } from "@/lib/api/client";

type AppRow = { status: string; direction?: string };
type Deal = { applications: AppRow[] };
type Resp = { deals: Deal[] };

export function usePartnershipAlerts(storeId?: string) {
  const query = useQuery({
    queryKey: ["partnership-alerts", storeId],
    queryFn: () => fetchWithAuth<Resp>(`/api/merchant/stores/${storeId}/partnerships`),
    enabled: Boolean(storeId),
    refetchInterval: 60_000,   // 응답이 늦으면 크루가 이탈하므로 1분마다 갱신
    staleTime: 30_000,
  });

  // 내가 보낸 제안은 '할 일'이 아니다 — 크루가 낸 신청만 센다
  const pending = (query.data?.deals ?? []).reduce((sum, d) => {
    const mine = (d.applications ?? []).filter(
      (a) => a.status === "pending" && (a.direction || "crew_apply") === "crew_apply"
    );
    return sum + mine.length;
  }, 0);

  return { pending, isLoading: query.isLoading };
}
