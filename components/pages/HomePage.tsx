"use client";

// 📊 오늘 탭 v2 — 레이어드 카드 톤(크림 배경 + 브랜드 앰버).
// 기간 토글(오늘/이번 주/이번 달)로 KPI·추이를 주가 차트처럼 전환.
// 데이터: /api/merchant/stores/{id}/overview + pulse + 기존 훅(핫딜 제안·공실 카드 유지).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { DemandRadarCard } from "@/components/pages/DemandRadarCard";

type Period = "today" | "week" | "month";

type Overview = {
  period: Period;
  store: { name: string; category: string };
  kpis: {
    reservations: number; guests: number; amount: number;
    delta: { reservations: number | null; guests: number | null; amount: number | null };
  };
  series: { label: string; guests: number; is_current: boolean }[];
  briefing: { time: string; party: number; tier: string }[];
  todo: { pending_reservations: number; pending_partnership_apps: number };
};

type StorePulse = {
  impressions: number; clicks: number; saves: number; ctr: number | null;
  daily: Array<{ date: string; impressions: number; clicks: number }>;
};

const PERIOD_LABEL: Record<Period, string> = { today: "오늘", week: "이번 주", month: "이번 달" };
const PREV_LABEL: Record<Period, string> = { today: "어제", week: "지난주", month: "지난달" };

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Delta({ v, base }: { v: number | null; base: string }) {
  if (v === null) return <span className="text-[10.5px] text-slate-300">{base} 데이터 없음</span>;
  const up = v >= 0;
  return (
    <span className={`text-[10.5px] font-medium ${up ? "text-emerald-600" : "text-rose-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(v)}% <span className="font-normal text-slate-400">{base} 대비</span>
    </span>
  );
}

// 주가풍 영역 차트 — 마지막(현재) 포인트 강조
function TrendChart({ series }: { series: Overview["series"] }) {
  const W = 560, H = 120, PAD = 10;
  const max = Math.max(1, ...series.map((s) => s.guests));
  const pts = series.map((s, i) => ({
    x: PAD + (i * (W - PAD * 2)) / Math.max(1, series.length - 1),
    y: H - PAD - (s.guests / max) * (H - PAD * 2 - 16),
    ...s,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H} L${pts[0].x},${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H + 18}`} className="mt-2 block w-full">
      <path d={area} fill="#FAEEDA" />
      <path d={line} fill="none" stroke="#F5A623" strokeWidth={2.5} strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.is_current ? 4.5 : 2.5} fill={p.is_current ? "#F5A623" : "#FCE3B8"} stroke={p.is_current ? "#fff" : "none"} strokeWidth={1.5} />
      ))}
      <text x={Math.min(last.x, W - 4)} y={Math.max(12, last.y - 9)} textAnchor="end" fontSize={11} fontWeight={600} fill="#854F0B">{last.guests}명</text>
      {pts.map((p, i) => (
        <text key={i} x={p.x} y={H + 13} textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"} fontSize={9.5} fill="#B49A6A">{p.label}</text>
      ))}
    </svg>
  );
}

export function HomePage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("today");
  const [ov, setOv] = useState<Overview | null>(null);
  const [pulse, setPulse] = useState<StorePulse | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: appReservations = [] } = useAppReservations(storeId);
  const { data: manualReservations = [] } = useReservations(storeId);
  const { data: legacyUnits = [] } = useTableUnits(storeId);
  const { data: storeTables = [] } = useStoreTables(storeId);
  const { data: snapshots = [] } = useTableSnapshots(storeId);
  const { data: rules = [] } = useRules(storeId);
  const units =
    storeTables.length > 0
      ? storeTables.map((t) => ({ max_capacity: t.capacity, quantity: 1 } as any))
      : legacyUnits;

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    setLoading(true);
    fetchWithAuth<Overview>(`/api/merchant/stores/${storeId}/overview?period=${period}`)
      .then((d) => { if (active) setOv(d); })
      .catch(() => { if (active) setOv(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [storeId, period]);

  useEffect(() => {
    if (!storeId) return;
    let active = true;
    fetchWithAuth<StorePulse>(`/api/merchant/stores/${storeId}/pulse?days=7`)
      .then((p) => { if (active) setPulse(p); })
      .catch(() => { if (active) setPulse(null); });
    return () => { active = false; };
  }, [storeId]);

  const today = todayStr();
  const todayReservations = useMemo(
    () =>
      appReservations
        .filter((r) => r.date === today && r.status !== "cancelled")
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appReservations, today]
  );

  const activeHotdeals = useMemo(() => rules.filter((r) => r.enabled), [rules]);
  const topSuggestion = useMemo(() => {
    try {
      const { suggestions } = suggestRules({
        reservations: [
          ...manualReservations.map((r) => ({ party_size: r.party_size, status: r.status, start_time: r.start_time })),
          ...appReservations.map((r) => ({ party_size: r.party_size, status: r.status, start_time: `${r.date}T${r.time || "00:00"}:00` })),
        ],
        units: units.map((u) => ({ max_capacity: u.max_capacity, quantity: u.quantity })),
        rules: activeHotdeals.map((r) => ({ enabled: r.enabled, days: r.days, time_blocks: r.time_blocks })),
        snapshots,
        maxSuggestions: 1,
      });
      return suggestions[0] ?? null;
    } catch { return null; }
  }, [manualReservations, appReservations, units, activeHotdeals, snapshots]);

  const todoCount = (ov?.todo.pending_reservations ?? 0) + (ov?.todo.pending_partnership_apps ?? 0);
  const kpis = ov?.kpis;
  const dateLabel = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "short" });
  const gauge = (v: number, max: number) => `${Math.min(100, Math.round((v / Math.max(1, max)) * 100))}%`;

  return (
    <div className="-m-4 min-h-full bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
      {/* 헤더 — 가게 + 기간 토글 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#F0E6D2] bg-white text-xl">🍽️</span>
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-bold text-slate-900">{ov?.store.name || "우리 가게"} — 한눈에</h1>
            <p className="text-[11.5px] text-[#B49A6A]">{dateLabel}{ov?.store.category ? ` · ${ov.store.category}` : ""}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex rounded-xl border border-[#F0E6D2] bg-white p-1">
            {(["today", "week", "month"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  period === p ? "bg-[#F5A623] text-white" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
          <Button className="hidden bg-slate-900 hover:bg-slate-800 sm:inline-flex" onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
            + 딜 발행
          </Button>
        </div>
      </div>

      {/* 퀵 이동 칩 — 오늘의 동선 */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {[
          { label: "📅 예약 현황", to: "reservations", badge: ov?.todo.pending_reservations || 0 },
          { label: "🤝 제휴 신청", to: "partnerships", badge: ov?.todo.pending_partnership_apps || 0 },
          { label: "💛 단골 알림", to: "regulars", badge: 0 },
          { label: "🔥 핫딜", to: "offers/rules", badge: 0 },
        ].map((c) => (
          <button
            key={c.to}
            onClick={() => router.push(`/stores/${storeId}/${c.to}`)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#F0E6D2] bg-white px-3 py-2 text-[12px] font-medium text-slate-600 transition-colors hover:border-[#F5A623]"
          >
            {c.label}
            {c.badge > 0 && (
              <span className="rounded-full bg-[#F5A623] px-1.5 py-0.5 text-[10px] font-bold text-white">{c.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* KPI 3 — 기간 연동 */}
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {[
          { label: `${PERIOD_LABEL[period]} 예약`, v: kpis ? `${kpis.reservations}건` : "—", d: kpis?.delta.reservations ?? null, g: kpis ? gauge(kpis.reservations, period === "today" ? 15 : period === "week" ? 60 : 200) : "0%" },
          { label: "예상 손님", v: kpis ? `${kpis.guests}명` : "—", d: kpis?.delta.guests ?? null, g: kpis ? gauge(kpis.guests, period === "today" ? 50 : period === "week" ? 250 : 800) : "0%" },
          { label: "정산 금액", v: kpis ? `${kpis.amount.toLocaleString()}원` : "—", d: kpis?.delta.amount ?? null, g: kpis ? gauge(kpis.amount, period === "today" ? 300000 : period === "week" ? 1500000 : 5000000) : "0%" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-[#F0E6D2] bg-white p-3.5">
            <div className="text-[11px] text-[#B49A6A]">{k.label}</div>
            <div className="mt-1 truncate text-[19px] font-bold text-slate-900">{loading ? "…" : k.v}</div>
            <div className="mt-1 h-5 overflow-hidden">
              <Delta v={k.d} base={PREV_LABEL[period]} />
            </div>
            <div className="relative h-[3px] overflow-hidden rounded bg-[#FAEEDA]">
              <div className="absolute inset-y-0 left-0 rounded bg-[#F5A623] transition-all" style={{ width: k.g }} />
            </div>
          </div>
        ))}
      </div>

      {/* 히어로 — 방문 손님 추이 (주가 차트 느낌) */}
      <div className="mt-3 rounded-2xl border border-[#F0E6D2] bg-white p-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-[12px] font-semibold text-slate-700">방문 손님 추이</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-[#854F0B]">{kpis ? `${kpis.guests}명` : "—"}</span>
              <Delta v={kpis?.delta.guests ?? null} base={PREV_LABEL[period]} />
            </div>
          </div>
          <span className="shrink-0 text-[10.5px] text-[#B49A6A]">
            {period === "today" ? "최근 7일 · 일별" : period === "week" ? "최근 8주 · 주별" : "최근 6개월 · 월별"}
          </span>
        </div>
        {ov && ov.series.length > 1 ? (
          <TrendChart series={ov.series} />
        ) : (
          <div className="py-8 text-center text-[12px] text-slate-300">{loading ? "불러오는 중…" : "아직 데이터가 없어요"}</div>
        )}
        {/* 수요 레이더 슬림 — 노출/클릭/저장 (손님 앱 실데이터) */}
        {pulse && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#F5EBD8] pt-3 text-[11.5px] text-slate-500">
            <span className="font-semibold text-slate-600">📡 최근 7일 손님 앱</span>
            <span>노출 <b className="text-slate-800">{pulse.impressions}</b></span>
            <span>클릭 <b className="text-slate-800">{pulse.clicks}</b></span>
            <span>저장 <b className="text-slate-800">{pulse.saves}</b></span>
            {pulse.ctr !== null && <span>클릭률 <b className="text-slate-800">{Math.round(pulse.ctr * 100)}%</b></span>}
          </div>
        )}
      </div>

      {/* 📡 지금 찾는 중인 크루 — 아직 안 온 손님. 기존 CRM이 못 보는 자리다 */}
      <DemandRadarCard storeId={storeId} />

      {/* 오늘 브리핑 (오늘 기간에서만) */}
      {period === "today" && (
        <div className="mt-3 rounded-2xl border border-[#F0E6D2] bg-white p-4">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">💡 오늘 브리핑</div>
          {ov && ov.briefing.length > 0 ? (
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
              {ov.briefing.map((b, i) => (
                <span key={i}>
                  {i > 0 && " · "}
                  <b className="font-semibold text-slate-800">{b.time}</b> {b.party}명
                  <span className={`ml-1 rounded px-1 py-0.5 text-[10px] font-bold ${
                    b.tier === "VIP" ? "bg-violet-100 text-violet-700"
                    : b.tier === "단골" ? "bg-emerald-100 text-emerald-700"
                    : b.tier === "재방문" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                  }`}>{b.tier}</span>
                </span>
              ))}
              {todoCount > 0 && (
                <span className="text-slate-500"> — 처리할 일 <b className="text-[#854F0B]">{todoCount}건</b> (예약 대기 {ov.todo.pending_reservations} · 제휴 신청 {ov.todo.pending_partnership_apps})</span>
              )}
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] text-slate-400">
              오늘 확정 예약이 아직 없어요.{topSuggestion ? " 아래 제안으로 빈 시간대를 채워보세요 👇" : ""}
            </p>
          )}
        </div>
      )}

      {/* AI 제안 — 한가한 시간대 핫딜 */}
      {topSuggestion && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#F5A623]/40 bg-[#FFF9EC] p-4">
          <span className="text-xl">🔥</span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-slate-800">{(topSuggestion as any).title || "한가한 시간대에 핫딜을 걸어보세요"}</div>
            <div className="mt-0.5 text-[11.5px] text-slate-500">{(topSuggestion as any).reason || "예약 데이터 기반 제안"}</div>
          </div>
          <Button className="shrink-0 bg-[#F5A623] hover:bg-[#e09415]" onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
            발행
          </Button>
        </div>
      )}

      {/* 공실 현황 (기존 카드 유지) */}
      <div className="mt-3">
        <VacancyCard storeId={storeId} />
      </div>

      {/* 오늘 예약 미리보기 */}
      <div className="mt-3 rounded-2xl border border-[#F0E6D2] bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="text-[12px] font-semibold text-slate-700">📅 오늘 예약 {todayReservations.length}건</div>
          <button onClick={() => router.push(`/stores/${storeId}/reservations`)} className="text-[11.5px] font-semibold text-[#B4791B]">
            전체 보기 →
          </button>
        </div>
        {todayReservations.length === 0 ? (
          <p className="mt-2 text-[12.5px] text-slate-400">오늘 들어온 앱 예약이 없어요.</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {todayReservations.slice(0, 4).map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-[#FBF6EA] px-3 py-2">
                <span className="text-[13px] font-bold text-slate-800">{r.time}</span>
                <span className="text-[12px] text-slate-500">{r.party_size}명</span>
                {r.table_label && <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">🪑 {r.table_label}</span>}
                <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  r.status === "confirmed" ? "bg-amber-100 text-amber-700" : r.status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                }`}>{r.status === "confirmed" ? "대기" : r.status === "completed" ? "완료" : r.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
