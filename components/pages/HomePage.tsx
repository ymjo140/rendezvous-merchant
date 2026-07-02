"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppReservations } from "@/lib/hooks/useAppReservations";
import { useReservations } from "@/lib/hooks/useReservations";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useStoreTables } from "@/lib/hooks/useStoreTables";
import { useTableSnapshots } from "@/lib/hooks/useTableSnapshots";
import { useRules } from "@/lib/hooks/useRules";
import { suggestRules } from "@/domain/offers/yieldEngine";
import { fetchWithAuth } from "@/lib/api/client";
import { VacancyCard } from "@/components/home/VacancyCard";

// 손님 앱(B2C) 행동로그 집계 — FastAPI /api/merchant/stores/{id}/pulse
type StorePulse = {
  impressions: number;
  clicks: number;
  saves: number;
  ctr: number | null;
  daily: Array<{ date: string; impressions: number; clicks: number }>;
  week_reservations: number;
  deposit_week: number;
  deposit_month: number;
  pending_reservations: number;
};

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
  const { data: legacyUnits = [] } = useTableUnits(storeId);
  const { data: storeTables = [] } = useStoreTables(storeId);
  const { data: snapshots = [] } = useTableSnapshots(storeId);
  // 좌석 SSOT: 테이블 맵 우선, 미등록 매장은 기존 수용량 폴백
  const units =
    storeTables.length > 0
      ? storeTables.map((t) => ({ max_capacity: t.capacity, quantity: 1 } as any))
      : legacyUnits;
  const { data: rules = [] } = useRules(storeId);
  const [pulse, setPulse] = useState<StorePulse | null>(null);

  const today = todayStr();
  const week = weekRange();

  // 수요 레이더: 손님 앱에서 내 가게가 얼마나 보였는지 (실패해도 카드만 숨김)
  useEffect(() => {
    if (!storeId) return;
    let active = true;
    fetchWithAuth<StorePulse>(`/api/merchant/stores/${storeId}/pulse?days=7`)
      .then((p) => {
        if (active) setPulse(p);
      })
      .catch(() => {
        if (active) setPulse(null);
      });
    return () => {
      active = false;
    };
  }, [storeId]);

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
        // 수기 + 앱(B2C) 예약 합산
        reservations: [
          ...manualReservations.map((r) => ({
            party_size: r.party_size,
            status: r.status,
            start_time: r.start_time,
          })),
          ...appReservations.map((r) => ({
            party_size: r.party_size,
            status: r.status,
            start_time: `${r.date}T${r.time || "00:00"}:00`,
          })),
        ],
        units: units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity })),
        rules: activeHotdeals.map((r) => ({
          enabled: r.enabled,
          days: r.days,
          time_blocks: r.time_blocks,
        })),
        snapshots, // 🪑 테이블맵 실측 스냅샷
        maxSuggestions: 1,
      });
      return suggestions[0] ?? null;
    } catch {
      return null;
    }
  }, [manualReservations, appReservations, units, activeHotdeals, snapshots]);

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

      {/* 🔴 지금 빈자리 원탭 알림 — 손님 앱 '지금 입장 가능' 노출 */}
      <VacancyCard storeId={storeId} />

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

      {/* 📡 수요 레이더(손님 앱 실데이터) + 예약금 정산 */}
      {pulse && (
        <Card className="border-brand/30">
          <CardHeader>
            <CardTitle className="text-base">📡 수요 레이더 · 최근 7일 (손님 앱 실데이터)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <div>
                <div className="flex flex-wrap gap-5">
                  <PulseStat label="내 가게 노출" value={pulse.impressions} suffix="회" />
                  <PulseStat label="클릭(상세 조회)" value={pulse.clicks} suffix="회" />
                  <PulseStat label="저장/찜" value={pulse.saves} suffix="회" />
                  {pulse.ctr !== null && (
                    <PulseStat label="클릭률" value={Math.round(pulse.ctr * 100)} suffix="%" />
                  )}
                </div>
                {pulse.daily.length > 0 ? (
                  <div className="mt-4 flex h-16 items-end gap-1.5">
                    {pulse.daily.map((d) => {
                      const max = Math.max(...pulse.daily.map((x) => x.impressions + x.clicks), 1);
                      const h = Math.max(8, Math.round(((d.impressions + d.clicks) / max) * 64));
                      return (
                        <div key={d.date} className="flex flex-col items-center gap-1" title={`${d.date}: 노출 ${d.impressions} · 클릭 ${d.clicks}`}>
                          <div className="w-7 rounded-t bg-brand/70" style={{ height: `${h}px` }} />
                          <div className="text-[9px] text-slate-400">{d.date.slice(5)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-slate-400">
                    아직 노출 데이터가 없어요. 핫딜을 등록하면 손님 앱에 노출됩니다.
                  </p>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs font-bold text-slate-500">💰 예약금 정산</div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {pulse.deposit_week.toLocaleString()}원
                  </span>
                  <span className="text-xs text-slate-400">이번 주</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  이번 달 누적 {pulse.deposit_month.toLocaleString()}원 · 예약 {pulse.week_reservations}건
                </div>
                <p className="mt-3 text-[11px] text-slate-400">
                  손님이 캐시로 결제한 예약금입니다. 취소 시 자동 환불돼요.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

function PulseStat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-bold text-slate-900">
        {value.toLocaleString()}
        <span className="ml-0.5 text-xs font-medium text-slate-400">{suffix}</span>
      </div>
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
