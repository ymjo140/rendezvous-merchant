"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppReservations } from "@/lib/hooks/useAppReservations";
import { useReservations } from "@/lib/hooks/useReservations";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useRules } from "@/lib/hooks/useRules";
import { suggestRules } from "@/domain/offers/yieldEngine";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekRange() {
  // 이번 주(월~일)
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 월=0
  const monday = new Date(now);
  monday.setDate(now.getDate() - day);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { from: fmt(monday), to: fmt(sunday) };
}

export function HomePage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const { data: appReservations = [] } = useAppReservations(storeId);
  const { data: manualReservations = [] } = useReservations(storeId);
  const { data: units = [] } = useTableUnits(storeId);
  const { data: rules = [] } = useRules(storeId);

  const today = todayStr();
  const week = weekRange();

  // 1) 오늘 예약 (앱)
  const todayReservations = useMemo(
    () =>
      appReservations
        .filter((r) => r.date === today && r.status !== "cancelled")
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appReservations, today]
  );

  // 2) 이번 주 예약 전환 (확정+완료)
  const weekConversions = useMemo(
    () =>
      appReservations.filter(
        (r) => r.date >= week.from && r.date <= week.to && (r.status === "confirmed" || r.status === "completed")
      ).length,
    [appReservations, week]
  );

  // 3) 노출 중인 핫딜 (enabled 룰)
  const activeHotdeals = useMemo(() => rules.filter((r) => r.enabled), [rules]);

  // 4) AI 할인 제안 (가장 한가한 유휴 시간대)
  const topSuggestion = useMemo(() => {
    try {
      const { suggestions } = suggestRules({
        reservations: manualReservations.map((r) => ({
          party_size: r.party_size,
          status: r.status,
          start_time: r.start_time,
        })),
        units: units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity })),
        rules: activeHotdeals.map((r) => ({
          enabled: r.enabled,
          days: r.days,
          time_blocks: r.time_blocks,
        })),
        maxSuggestions: 1,
      });
      return suggestions[0] ?? null;
    } catch {
      return null;
    }
  }, [manualReservations, units, activeHotdeals]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">오늘 한눈에</h1>
          <p className="text-sm text-slate-500">매장 #{storeId}</p>
        </div>
        <Button className="bg-brand hover:bg-brand-dark" onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
          + 핫딜 만들기
        </Button>
      </div>

      {/* 요약 4지표 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard label="오늘 예약" value={`${todayReservations.length}건`} accent />
        <SummaryCard label="이번 주 전환" value={`${weekConversions}건`} />
        <SummaryCard label="노출 중 핫딜" value={`${activeHotdeals.length}개`} />
        <SummaryCard
          label="대기 중 예약"
          value={`${appReservations.filter((r) => r.status === "confirmed" && r.date >= today).length}건`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 오늘 예약 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📅 오늘 예약</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todayReservations.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">오늘 예약이 없습니다.</p>
            ) : (
              todayReservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                  <div className="text-sm font-semibold text-slate-900">
                    {r.time} · {r.party_size}명
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.status === "completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {r.status === "completed" ? "방문완료" : "예약대기"}
                  </span>
                </div>
              ))
            )}
            <Button
              variant="ghost"
              className="w-full text-sm text-slate-500"
              onClick={() => router.push(`/stores/${storeId}/reservations`)}
            >
              예약 전체 보기 →
            </Button>
          </CardContent>
        </Card>

        {/* AI 할인 제안 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🤖 AI 할인 제안</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSuggestion ? (
              <>
                <div className="rounded-xl border border-brand/30 bg-brand-light/50 p-4">
                  <div className="text-lg font-bold text-slate-900">
                    {topSuggestion.dowLabel} {topSuggestion.start}~{topSuggestion.end}{" "}
                    <span className="text-brand-dark">{topSuggestion.discountPct}% 할인</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{topSuggestion.reason}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    예상 추가 {topSuggestion.expectedExtraSeats}석 · {topSuggestion.confidence}
                  </p>
                </div>
                <Button
                  className="w-full bg-brand hover:bg-brand-dark"
                  onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}
                >
                  이 시간대 핫딜 만들기
                </Button>
              </>
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">
                지금은 한가한 시간대 제안이 없습니다.
              </p>
            )}
            <Button
              variant="ghost"
              className="w-full text-sm text-slate-500"
              onClick={() => router.push(`/stores/${storeId}/offers/ai`)}
            >
              AI 수익엔진 전체 보기 →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 노출 중 핫딜 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">🔥 노출 중인 핫딜</CardTitle>
        </CardHeader>
        <CardContent>
          {activeHotdeals.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">진행 중인 핫딜이 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeHotdeals.map((r) => (
                <span
                  key={r.id}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                >
                  {r.name || r.benefit_title || "핫딜"}
                  {typeof r.inventory_cap === "number" && r.inventory_cap > 0 && (
                    <span className="ml-1 text-slate-400">
                      {Math.max(0, r.inventory_cap - (r.inventory_used ?? 0))}개 남음
                    </span>
                  )}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={accent ? "border-brand/40 bg-brand-light/40" : ""}>
      <CardContent className="p-4">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
