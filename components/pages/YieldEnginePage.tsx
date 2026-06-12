"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStoreId } from "@/components/layout/Layout";
import { useReservations } from "@/lib/hooks/useReservations";
import { useAppReservations } from "@/lib/hooks/useAppReservations";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useRules, type RuleRow } from "@/lib/hooks/useRules";
import { usePlaceCategory } from "@/lib/hooks/usePlaceCategory";
import { fetchWithAuth } from "@/lib/api/client";
import {
  suggestRules,
  DAYPARTS,
  jsDowToUiIndex,
  totalSeats,
  type Suggestion,
  type Cell,
} from "@/domain/offers/yieldEngine";

// 핫딜별 성과 귀속(노출→클릭→예약→예약금) — FastAPI offer-performance
type OfferPerf = {
  rule_id: number;
  name: string;
  benefit_title: string;
  enabled: boolean;
  impressions: number;
  clicks: number;
  reservations: number;
  deposit_sum: number;
  inventory_cap: number;
  inventory_used: number;
  remaining: number | null;
  ctr: number | null;
  conversion: number | null;
};
type OfferPerfResponse = {
  rules: OfferPerf[];
  totals: { impressions: number; clicks: number; reservations: number; deposit_sum: number };
};

// 월요일 시작 컬럼 → JS getDay() 매핑
const DAY_COLUMNS = [
  { label: "월", jsDow: 1 },
  { label: "화", jsDow: 2 },
  { label: "수", jsDow: 3 },
  { label: "목", jsDow: 4 },
  { label: "금", jsDow: 5 },
  { label: "토", jsDow: 6 },
  { label: "일", jsDow: 0 },
];

function occColor(predicted: number): string {
  // 0(한가)=빨강 ~ 1(만석)=초록
  const hue = Math.round(predicted * 140);
  return `hsl(${hue}, 65%, 90%)`;
}

export function YieldEnginePage({ storeId }: { storeId?: string }) {
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : contextStoreId ?? undefined;

  const { data: reservations = [] } = useReservations(resolvedStoreId);
  const { data: appReservations = [] } = useAppReservations(resolvedStoreId);
  const { data: units = [] } = useTableUnits(resolvedStoreId);
  const { data: rules = [], createRule } = useRules(resolvedStoreId);
  const { data: category } = usePlaceCategory(resolvedStoreId);
  const [perf, setPerf] = useState<OfferPerfResponse | null>(null);

  // 핫딜 성과 리포트 로드 (실패 시 섹션 숨김)
  useEffect(() => {
    if (!resolvedStoreId) return;
    let active = true;
    fetchWithAuth<OfferPerfResponse>(`/api/merchant/stores/${resolvedStoreId}/offer-performance`)
      .then((p) => {
        if (active) setPerf(p);
      })
      .catch(() => {
        if (active) setPerf(null);
      });
    return () => {
      active = false;
    };
  }, [resolvedStoreId]);

  const { grid, suggestions } = useMemo(
    () =>
      suggestRules({
        // 수기 예약 + 앱(B2C) 예약을 합산 — 플랫폼이 만든 예약도 점유율 학습에 반영
        reservations: [
          ...reservations.map((r) => ({
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
        units: units.map((u) => ({
          max_capacity: u.max_capacity,
          quantity: u.quantity,
        })),
        rules: rules.map((r) => ({
          enabled: r.enabled,
          days: r.days,
          time_blocks: r.time_blocks,
        })),
        category,
      }),
    [reservations, appReservations, units, rules, category]
  );

  const cellAt = (jsDow: number, dpKey: string): Cell | undefined =>
    grid.find((c) => c.dow === jsDow && c.daypart === dpKey);

  const seats = totalSeats(units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity })));
  const hasObserved = grid.some((c) => c.observed !== null);

  function applySuggestion(s: Suggestion) {
    const days = Array.from({ length: 7 }, () => false);
    days[jsDowToUiIndex(s.dow)] = true;
    const placeId = Number(resolvedStoreId);
    const rule: RuleRow = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `tmp-${Date.now()}`,
      store_id: resolvedStoreId,
      place_id: Number.isFinite(placeId) ? placeId : null,
      name: `AI 추천 · ${s.dowLabel} ${s.daypartLabel} ${s.discountPct}% 핫딜`,
      enabled: true,
      days,
      time_blocks: [{ start: s.start, end: s.end }],
      party_min: null,
      party_max: null,
      lead_min: null,
      lead_max: null,
      benefit_type: "PERCENT_DISCOUNT",
      benefit_value: String(s.discountPct),
      benefit_title: `${s.discountPct}% 할인`,
      is_auto_apply: true,
      visibility: "public",
    };
    createRule.mutate(rule);
  }

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">AI 수익엔진</h1>
        <p className="text-sm text-slate-500">
          한가한 시간대를 찾아 자동으로 핫딜을 제안합니다. 예약 데이터가 쌓일수록 정확해져요.
        </p>
      </div>

      {/* 데이터 신뢰도 안내 */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        {hasObserved
          ? "실제 예약 데이터를 반영해 점유율을 추정했습니다."
          : "아직 예약/좌석 데이터가 적어 업종 평균 기준으로 추정했습니다. 예약·좌석을 등록하면 더 정확해집니다."}
        {seats > 0 ? ` · 총 좌석 ${seats}석` : " · 좌석 미등록"}
      </div>

      {/* 점유율 히트맵 */}
      <Card>
        <CardHeader>
          <CardTitle>예상 점유율 (요일 × 시간대)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-center text-xs">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-slate-500">시간대</th>
                {DAY_COLUMNS.map((d) => (
                  <th key={d.label} className="p-2 font-medium text-slate-500">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYPARTS.map((dp) => (
                <tr key={dp.key}>
                  <td className="p-2 text-left text-slate-600">
                    {dp.label}
                    <span className="ml-1 text-[10px] text-slate-400">
                      {dp.start}~{dp.end}
                    </span>
                  </td>
                  {DAY_COLUMNS.map((d) => {
                    const cell = cellAt(d.jsDow, dp.key);
                    const pct = cell ? Math.round(cell.predicted * 100) : 0;
                    return (
                      <td
                        key={d.label}
                        className="p-2 font-medium text-slate-700"
                        style={{ backgroundColor: occColor(cell?.predicted ?? 0) }}
                        title={cell?.observed !== null ? "실측 반영" : "추정"}
                      >
                        {pct}%
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-2 text-[11px] text-slate-400">
            빨강에 가까울수록 한가한 시간대(=핫딜 기회), 초록에 가까울수록 붐비는 시간대입니다.
          </div>
        </CardContent>
      </Card>

      {/* 추천 핫딜 */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">추천 핫딜 {suggestions.length}건</h2>
        {suggestions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            지금은 추천할 유휴 시간대가 없습니다. 모든 한가한 시간대에 이미 룰이 적용돼 있어요.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {suggestions.map((s) => (
              <div
                key={`${s.dow}-${s.daypart}`}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">
                      {s.dowLabel}요일 {s.daypartLabel} · {s.discountPct}% 할인
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {s.start}~{s.end} · 예상 점유율 {Math.round(s.predicted * 100)}%
                    </div>
                  </div>
                  <Badge
                    className={
                      s.confidence === "데이터 기반"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }
                  >
                    {s.confidence}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-600">
                    유휴 시간대
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">
                    예상 +{s.expectedExtraSeats}석
                  </span>
                </div>
                <Button
                  className="mt-3 w-full"
                  onClick={() => applySuggestion(s)}
                  disabled={createRule.isPending}
                >
                  이 핫딜 룰 적용
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 📊 핫딜 성과 — 손님 앱 노출→클릭→예약→예약금 귀속 (실데이터) */}
      {perf && perf.rules.length > 0 && (
        <Card className="border-brand/30">
          <CardHeader>
            <CardTitle>📊 내 핫딜 성과 (손님 앱 실데이터)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-5 rounded-xl bg-slate-50 p-4">
              <PerfStat label="총 노출" value={`${perf.totals.impressions.toLocaleString()}회`} />
              <PerfStat label="클릭" value={`${perf.totals.clicks.toLocaleString()}회`} />
              <PerfStat label="예약 전환" value={`${perf.totals.reservations.toLocaleString()}건`} />
              <PerfStat
                label="발생 예약금"
                value={`${perf.totals.deposit_sum.toLocaleString()}원`}
                accent
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="p-2 font-medium">핫딜</th>
                    <th className="p-2 text-right font-medium">노출</th>
                    <th className="p-2 text-right font-medium">클릭</th>
                    <th className="p-2 text-right font-medium">예약</th>
                    <th className="p-2 text-right font-medium">예약금</th>
                    <th className="p-2 text-right font-medium">수량</th>
                  </tr>
                </thead>
                <tbody>
                  {perf.rules.map((r) => (
                    <tr key={r.rule_id} className="border-b border-slate-100">
                      <td className="p-2">
                        <span className="font-medium text-slate-800">{r.name}</span>
                        {!r.enabled && (
                          <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                            꺼짐
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-right text-slate-600">{r.impressions.toLocaleString()}</td>
                      <td className="p-2 text-right text-slate-600">
                        {r.clicks.toLocaleString()}
                        {r.ctr !== null && (
                          <span className="ml-1 text-[10px] text-slate-400">({Math.round(r.ctr * 100)}%)</span>
                        )}
                      </td>
                      <td className="p-2 text-right font-semibold text-slate-800">{r.reservations}</td>
                      <td className="p-2 text-right font-semibold text-brand-dark">
                        {r.deposit_sum.toLocaleString()}원
                      </td>
                      <td className="p-2 text-right text-slate-500">
                        {r.inventory_cap > 0 ? `${r.remaining}/${r.inventory_cap}` : "무제한"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400">
              노출·클릭은 손님 앱(랑데부) 핫딜 탭 실측, 예약·예약금은 해당 핫딜로 들어온 앱 예약 기준입니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PerfStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold ${accent ? "text-brand-dark" : "text-slate-900"}`}>{value}</div>
    </div>
  );
}
