"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreId } from "@/components/layout/Layout";
import { useReservations } from "@/lib/hooks/useReservations";
import { useRules } from "@/lib/hooks/useRules";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useTimeDeals } from "@/lib/hooks/useTimeDeals";
import { usePlaceCategory } from "@/lib/hooks/usePlaceCategory";
import { buildOccupancyGrid, DAYPARTS, totalSeats } from "@/domain/offers/yieldEngine";

const ACTIVE_STATUS = new Set(["confirmed", "pending", "seated", "completed"]);

export function InsightsPage({ storeId }: { storeId?: string }) {
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : contextStoreId ?? undefined;

  const { data: reservations = [] } = useReservations(resolvedStoreId);
  const { data: rules = [] } = useRules(resolvedStoreId);
  const { data: units = [] } = useTableUnits(resolvedStoreId);
  const { data: timeDeals = [] } = useTimeDeals(resolvedStoreId);
  const { data: category } = usePlaceCategory(resolvedStoreId);

  const metrics = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthReservations = reservations.filter((r) => {
      const d = new Date(r.start_time);
      return (
        !Number.isNaN(d.getTime()) &&
        d >= monthStart &&
        ACTIVE_STATUS.has((r.status || "").toLowerCase())
      );
    }).length;

    const activeRules = rules.filter((r) => r.enabled).length;
    const today = now.toISOString().slice(0, 10);
    const upcomingDeals = timeDeals.filter((d) => (d.date ?? "") >= today).length;
    const seats = totalSeats(
      units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity }))
    );

    const grid = buildOccupancyGrid({
      reservations: reservations.map((r) => ({
        party_size: r.party_size,
        status: r.status,
        start_time: r.start_time,
      })),
      units: units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity })),
      category,
    });
    const trend = DAYPARTS.map((dp) => {
      const cells = grid.filter((c) => c.daypart === dp.key);
      const avg = cells.reduce((a, c) => a + c.predicted, 0) / (cells.length || 1);
      return { label: dp.label, pct: Math.round(avg * 100) };
    });
    const hasObserved = grid.some((c) => c.observed !== null);

    return { monthReservations, activeRules, upcomingDeals, seats, trend, hasObserved };
  }, [reservations, rules, units, timeDeals, category]);

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요.
      </div>
    );
  }

  const kpis = [
    { label: "이번 달 예약", value: metrics.monthReservations, suffix: "건" },
    { label: "활성 룰", value: metrics.activeRules, suffix: "개" },
    { label: "진행 예정 핫딜", value: metrics.upcomingDeals, suffix: "건" },
    { label: "등록 좌석", value: metrics.seats, suffix: "석" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">인사이트</h1>
        <p className="text-sm text-slate-500">매장 #{resolvedStoreId}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500">{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {item.value}
              <span className="ml-1 text-sm font-normal text-slate-400">{item.suffix}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>시간대별 예상 점유율</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.trend.map((t) => (
            <div key={t.label} className="flex items-center gap-3">
              <div className="w-12 text-sm text-slate-600">{t.label}</div>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${t.pct}%` }}
                />
              </div>
              <div className="w-10 text-right text-sm font-medium text-slate-700">
                {t.pct}%
              </div>
            </div>
          ))}
          <div className="text-[11px] text-slate-400">
            {metrics.hasObserved
              ? "실제 예약 데이터를 반영한 점유율입니다."
              : "예약 데이터가 적어 업종 평균 기준으로 추정했습니다. 예약이 쌓이면 실측 기반으로 전환됩니다."}
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        매출·전환율 지표는 결제/방문 인증 데이터 연동 후 제공됩니다.
      </div>
    </div>
  );
}
