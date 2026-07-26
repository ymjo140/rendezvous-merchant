"use client";

// 📊 분석 v2 — 빈 시간 찾기 / 가게 흐름 2서브탭 (크림+앰버 디자인 시스템)
// 빈 시간 찾기: 색 히트맵(한가=빨강·기회) + 🔥 최저 칸 + 셀 탭→추천 연결 + 원클릭 발행
// 가게 흐름: 인사이트 페이지 흡수(시간대 점유 바·이달 지표). 핫딜 성과는 핫딜 탭으로 이사(중복 제거).

import { useMemo, useState } from "react";
import { useStoreId } from "@/components/layout/Layout";
import { useReservations } from "@/lib/hooks/useReservations";
import { useAppReservations } from "@/lib/hooks/useAppReservations";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useStoreTables } from "@/lib/hooks/useStoreTables";
import { useTableSnapshots } from "@/lib/hooks/useTableSnapshots";
import { useRules, type RuleRow } from "@/lib/hooks/useRules";
import { usePlaceCategory } from "@/lib/hooks/usePlaceCategory";
import {
  suggestRules,
  totalSeats,
  DAYPARTS,
  type Cell,
  type Suggestion,
} from "@/domain/offers/yieldEngine";

type Tab = "find" | "flow";

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

function jsDowToUiIndex(jsDow: number) {
  // RuleRow.days는 [월..일] — JS 일요일(0)은 마지막
  return (jsDow + 6) % 7;
}

// 3단 색: 한가(빨강=기회) / 보통(크림) / 붐빔(초록)
function cellStyle(predicted: number, isMin: boolean): { bg: string; fg: string } {
  if (isMin) return { bg: "#F09595", fg: "#ffffff" };
  if (predicted < 0.35) return { bg: "#FCEBEB", fg: "#A32D2D" };
  if (predicted < 0.6) return { bg: "#FAEEDA", fg: "#854F0B" };
  return { bg: "#9FE1CB", fg: "#085041" };
}

export function YieldEnginePage({ storeId }: { storeId?: string }) {
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : contextStoreId ?? undefined;

  const { data: reservations = [] } = useReservations(resolvedStoreId);
  const { data: appReservations = [] } = useAppReservations(resolvedStoreId);
  const { data: legacyUnits = [] } = useTableUnits(resolvedStoreId);
  const { data: storeTables = [] } = useStoreTables(resolvedStoreId);
  const { data: snapshots = [] } = useTableSnapshots(resolvedStoreId);
  const units =
    storeTables.length > 0
      ? storeTables.map((t) => ({ max_capacity: t.capacity, quantity: 1 } as any))
      : legacyUnits;
  const { data: rules = [], createRule } = useRules(resolvedStoreId);
  const { data: category } = usePlaceCategory(resolvedStoreId);

  const [tab, setTab] = useState<Tab>("find");
  const [picked, setPicked] = useState<{ dow: number; dp: string } | null>(null);

  const { grid, suggestions } = useMemo(
    () =>
      suggestRules({
        reservations: [
          ...reservations.map((r) => ({ party_size: r.party_size, status: r.status, start_time: r.start_time })),
          ...appReservations.map((r) => ({ party_size: r.party_size, status: r.status, start_time: `${r.date}T${r.time || "00:00"}:00` })),
        ],
        units: units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity })),
        rules: rules.map((r) => ({ enabled: r.enabled, days: r.days, time_blocks: r.time_blocks })),
        category,
        snapshots,
      }),
    [reservations, appReservations, units, rules, category, snapshots]
  );

  const cellAt = (jsDow: number, dpKey: string): Cell | undefined =>
    grid.find((c) => c.dow === jsDow && c.daypart === dpKey);

  const seats = totalSeats(units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity })));
  const hasObserved = grid.some((c) => c.observed !== null);

  // 최저/최고 칸 (요약 스트립 + 🔥 마크)
  const { minCell, maxCell } = useMemo(() => {
    let mn: Cell | null = null;
    let mx: Cell | null = null;
    for (const c of grid) {
      if (!mn || c.predicted < mn.predicted) mn = c;
      if (!mx || c.predicted > mx.predicted) mx = c;
    }
    return { minCell: mn, maxCell: mx };
  }, [grid]);

  const dowLabel = (jsDow: number) => DAY_COLUMNS.find((d) => d.jsDow === jsDow)?.label ?? "";
  const dpLabel = (key: string) => DAYPARTS.find((d) => d.key === key)?.label ?? key;

  // 이달 지표 (가게 흐름)
  const month = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const ok = new Set(["confirmed", "pending", "seated", "completed"]);
    const all = [
      ...reservations.map((r) => ({ t: new Date(r.start_time), n: r.party_size || 0, s: (r.status || "").toLowerCase() })),
      ...appReservations.map((r) => ({ t: new Date(`${r.date}T${r.time || "00:00"}:00`), n: r.party_size || 0, s: r.status })),
    ].filter((x) => !Number.isNaN(x.t.getTime()) && x.t >= start && ok.has(x.s));
    return { count: all.length, guests: all.reduce((a, x) => a + x.n, 0) };
  }, [reservations, appReservations]);

  // 시간대별 평균 점유 (가게 흐름)
  const daypartAvg = useMemo(
    () =>
      DAYPARTS.map((dp) => {
        const cells = grid.filter((c) => c.daypart === dp.key);
        const avg = cells.reduce((a, c) => a + c.predicted, 0) / (cells.length || 1);
        return { label: dp.label, pct: Math.round(avg * 100) };
      }),
    [grid]
  );

  const pickedSuggestion = picked
    ? suggestions.find((s) => s.dow === picked.dow && s.daypart === picked.dp) ?? null
    : null;

  function applySuggestion(s: Suggestion) {
    const days = Array.from({ length: 7 }, () => false);
    days[jsDowToUiIndex(s.dow)] = true;
    const placeId = Number(resolvedStoreId);
    const rule: RuleRow = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tmp-${Date.now()}`,
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
    <div className="-m-4 min-h-full space-y-3 bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
      {/* 헤더 + 서브탭 */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900">분석</h1>
          <p className="text-[11.5px] text-[#B49A6A]">한가한 시간을 찾아 핫딜로 채우기 — 예약이 쌓일수록 정확해져요</p>
        </div>
        <div className="ml-auto flex rounded-xl border border-[#F0E6D2] bg-white p-1">
          {([
            { k: "find", l: "🔥 빈 시간 찾기" },
            { k: "flow", l: "📊 가게 흐름" },
          ] as { k: Tab; l: string }[]).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                tab === t.k ? "bg-[#F5A623] text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 스트립 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { l: "가장 한가", v: minCell ? `${dowLabel(minCell.dow)} ${dpLabel(minCell.daypart)}` : "—", hot: true },
          { l: "가장 붐빔", v: maxCell ? `${dowLabel(maxCell.dow)} ${dpLabel(maxCell.daypart)}` : "—", hot: false },
          { l: "이달 예약", v: `${month.count}건`, hot: false },
          { l: "총 좌석", v: seats > 0 ? `${seats}석` : "미등록", hot: false },
        ].map((k) => (
          <div key={k.l} className={`rounded-2xl border bg-white p-3 text-center ${k.hot ? "border-[#F5A623]" : "border-[#F0E6D2]"}`}>
            <div className={`truncate text-[14px] font-bold ${k.hot ? "text-[#854F0B]" : "text-slate-900"}`}>{k.v}</div>
            <div className="text-[10px] text-[#B49A6A]">{k.l}</div>
          </div>
        ))}
      </div>

      {/* ─────────────── 🔥 빈 시간 찾기 ─────────────── */}
      {tab === "find" && (
        <>
          {/* 히트맵 */}
          <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] font-semibold text-slate-700">예상 점유율</span>
              <span className="ml-auto flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FCEBEB]" />한가(기회)</span>
                <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#FAEEDA]" />보통</span>
                <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[#9FE1CB]" />붐빔</span>
              </span>
            </div>
            <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: "56px repeat(7, 1fr)" }}>
              <div />
              {DAY_COLUMNS.map((d) => (
                <div key={d.label} className="pb-0.5 text-center text-[10.5px] text-[#B49A6A]">{d.label}</div>
              ))}
              {DAYPARTS.map((dp) => (
                <>
                  <div key={`lab-${dp.key}`} className="flex flex-col justify-center text-[10.5px] leading-tight text-slate-500">
                    {dp.label}
                    <span className="text-[8.5px] text-slate-300">{dp.start}–{dp.end}</span>
                  </div>
                  {DAY_COLUMNS.map((d) => {
                    const cell = cellAt(d.jsDow, dp.key);
                    const pct = cell ? Math.round(cell.predicted * 100) : 0;
                    const isMin = !!minCell && !!cell && minCell.dow === cell.dow && minCell.daypart === cell.daypart;
                    const st = cellStyle(cell?.predicted ?? 0, isMin);
                    const isPicked = picked?.dow === d.jsDow && picked?.dp === dp.key;
                    return (
                      <button
                        key={`${dp.key}-${d.label}`}
                        onClick={() => setPicked(isPicked ? null : { dow: d.jsDow, dp: dp.key })}
                        title={cell?.observed !== null ? "실측 반영" : "추정"}
                        className={`flex h-9 items-center justify-center rounded-lg text-[10.5px] font-semibold transition-all ${
                          isPicked ? "outline outline-2 outline-[#F5A623] outline-offset-1" : ""
                        }`}
                        style={{ backgroundColor: st.bg, color: st.fg }}
                      >
                        {isMin && "🔥"}{pct}
                      </button>
                    );
                  })}
                </>
              ))}
            </div>
            <p className="mt-2 text-[10.5px] text-[#B49A6A]">
              {hasObserved ? "실제 예약 데이터 반영" : "예약 데이터가 적어 업종 평균 기준 추정"} · 🔥 = 가장 한가한 칸 · 칸을 탭하면 그 시간대 추천을 보여줘요
            </p>
          </div>

          {/* 선택한 칸의 추천 (있으면 최상단 강조) */}
          {picked && (
            <div className="rounded-2xl border border-[#F5A623] bg-[#FFF9EC] p-4">
              {pickedSuggestion ? (
                <SuggestionCard s={pickedSuggestion} highlight onApply={applySuggestion} busy={createRule.isPending} />
              ) : (
                <p className="text-[12px] text-[#854F0B]">
                  <b>{dowLabel(picked.dow)} {dpLabel(picked.dp)}</b>은 이미 핫딜이 걸려 있거나 충분히 붐비는 시간대예요.
                </p>
              )}
            </div>
          )}

          {/* 추천 목록 */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[12px] font-bold text-slate-700">추천 핫딜 {suggestions.length}건</span>
            <span className="ml-auto text-[10.5px] text-[#B49A6A]">한가한 칸 → 할인 제안 · 발행하면 손님 앱 노출</span>
          </div>
          {suggestions.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-10 text-center">
              <div className="text-2xl">✅</div>
              <p className="mt-2 text-sm text-slate-500">지금은 추천할 빈 시간대가 없어요.</p>
              <p className="mt-1 text-[11px] text-slate-400">한가한 시간대에 이미 핫딜이 걸려 있어요.</p>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              {suggestions.map((s) => (
                <SuggestionCard key={`${s.dow}-${s.daypart}`} s={s} onApply={applySuggestion} busy={createRule.isPending} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ─────────────── 📊 가게 흐름 ─────────────── */}
      {tab === "flow" && (
        <>
          <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
            <div className="text-[12px] font-semibold text-slate-700">시간대별 평균 점유율</div>
            <div className="mt-3 space-y-2.5">
              {daypartAvg.map((d) => {
                const low = d.pct < 40;
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <span className="w-10 text-[12px] text-slate-500">{d.label}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded bg-[#FAEEDA]">
                      <div className={`h-full rounded ${low ? "bg-[#E24B4A]" : "bg-[#F5A623]"}`} style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className={`w-10 text-right text-[12px] font-bold ${low ? "text-[#A32D2D]" : "text-slate-800"}`}>{d.pct}%</span>
                  </div>
                );
              })}
            </div>
            <p className="mt-2.5 text-[10.5px] text-[#B49A6A]">빨간 구간이 핫딜·제휴 딜을 걸 기회예요</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { l: "이달 예약", v: `${month.count}건` },
              { l: "이달 손님", v: `${month.guests}명` },
              { l: "노출 중 핫딜", v: `${rules.filter((r) => r.enabled).length}개` },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl border border-[#F0E6D2] bg-white p-3 text-center">
                <div className="text-[15px] font-bold text-slate-900">{k.v}</div>
                <div className="text-[10px] text-[#B49A6A]">{k.l}</div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-[#FFF9EC] px-3.5 py-2.5 text-[11.5px] text-[#854F0B]">
            💡 핫딜 성과(노출→클릭→예약)는 <b>핫딜 탭 → 📈 성과</b>, 제휴 성과는 <b>제휴 탭 → 📈 성과</b>, 단골 진단은 <b>단골 탭 → 📊 인사이트</b>에서 — 여긴 가게의 큰 흐름만 봐요.
          </div>
        </>
      )}
    </div>
  );
}

function SuggestionCard({
  s, highlight, busy, onApply,
}: {
  s: Suggestion; highlight?: boolean; busy: boolean; onApply: (s: Suggestion) => void;
}) {
  return (
    <div className={highlight ? "" : "rounded-2xl border border-[#F0E6D2] bg-white p-4"}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px] font-semibold text-slate-900">
            🔥 {s.dowLabel}요일 {s.daypartLabel}이 한가해요 ({Math.round(s.predicted * 100)}%)
          </div>
          <div className="mt-0.5 text-[11.5px] text-slate-500">
            {s.start}–{s.end} · 예상 +{s.expectedExtraSeats}석 → <b className="text-[#854F0B]">{s.discountPct}% 핫딜</b> 제안
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
          s.confidence === "데이터 기반" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
        }`}>
          {s.confidence}
        </span>
      </div>
      <div className="mt-2.5 flex justify-end">
        <button
          onClick={() => onApply(s)}
          disabled={busy}
          className="rounded-xl bg-[#F5A623] px-4 py-2 text-[11.5px] font-bold text-white hover:bg-[#e09415] disabled:opacity-50"
        >
          ⚡ 바로 발행
        </button>
      </div>
    </div>
  );
}
