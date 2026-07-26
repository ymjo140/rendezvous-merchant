"use client";

// 🔥 핫딜 v2 — 내 핫딜/성과/혜택 보관함 3서브탭 (크림+앰버 디자인 시스템)
// "룰" 용어 제거. 딜 카드에 토글+조건 칩+성과 한 줄(노출→클릭→예약) — 발행한 딜이 일하는지 카드에서 바로.
// 성과 탭: 분석 탭에 숨어 있던 퍼널을 핫딜 안으로 (offer-performance 재사용).

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useRules, type RuleRow } from "@/lib/hooks/useRules";
import { useBenefits } from "@/lib/hooks/useBenefits";
import { useStoreId } from "@/components/layout/Layout";
import { fetchWithAuth } from "@/lib/api/client";

type OfferPerf = {
  rule_id: number; name: string; benefit_title: string; enabled: boolean;
  impressions: number; clicks: number; reservations: number; deposit_sum: number;
  inventory_cap: number; inventory_used: number; remaining: number | null;
  ctr: number | null; conversion: number | null;
};
type OfferPerfResponse = {
  rules: OfferPerf[];
  totals: { impressions: number; clicks: number; reservations: number; deposit_sum: number };
};

type Tab = "deals" | "perf" | "benefits";

const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
const formatDays = (days: boolean[]) => {
  const on = days.map((e, i) => (e ? dayLabels[i] : null)).filter(Boolean);
  if (on.length === 7) return "매일";
  if (on.length === 0) return "요일 미설정";
  return on.join("·");
};
const formatBlocks = (blocks: Array<{ start: string; end: string }>) =>
  blocks.map((b) => `${b.start}–${b.end}`).join(", ") || "시간 미설정";

export function OfferRulesPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const contextStoreId = useStoreId();
  const resolvedStoreId = useMemo(() => {
    if (storeId && storeId !== "undefined" && storeId !== "null") return storeId;
    if (contextStoreId) return contextStoreId;
    return undefined;
  }, [storeId, contextStoreId]);

  // ⚠️ 훅은 조건부 return보다 먼저
  const { data: rules = [], updateRule, deleteRule } = useRules(resolvedStoreId);
  const { data: benefits = [] } = useBenefits(resolvedStoreId);
  const [tab, setTab] = useState<Tab>("deals");
  const [perf, setPerf] = useState<OfferPerfResponse | null>(null);

  useEffect(() => {
    if (!resolvedStoreId) return;
    let active = true;
    fetchWithAuth<OfferPerfResponse>(`/api/merchant/stores/${resolvedStoreId}/offer-performance`)
      .then((d) => { if (active) setPerf(d); })
      .catch(() => { if (active) setPerf(null); });
    return () => { active = false; };
  }, [resolvedStoreId]);

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요."}
      </div>
    );
  }

  const perfByRule = new Map<string, OfferPerf>((perf?.rules ?? []).map((p) => [String(p.rule_id), p]));
  const activeRules = rules.filter((r) => r.enabled);
  const inactiveRules = rules.filter((r) => !r.enabled);

  // 💡 제안 — 전환 최고인 활성 딜
  const best = (perf?.rules ?? [])
    .filter((p) => p.enabled && p.conversion != null && p.reservations > 0)
    .sort((a, b) => (b.conversion ?? 0) - (a.conversion ?? 0))[0];

  const toggleRule = (ruleId: RuleRow["id"]) => {
    const target = rules.find((item) => String(item.id) === String(ruleId));
    if (!target) return;
    updateRule.mutate({ id: String(ruleId), enabled: !target.enabled });
  };
  const handleDelete = (ruleId: RuleRow["id"]) => {
    if (!window.confirm("핫딜을 삭제할까요?")) return;
    deleteRule.mutate({ id: String(ruleId) });
  };

  const totals = perf?.totals;

  return (
    <div className="-m-4 min-h-full space-y-3 bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
      {/* 헤더 + 서브탭 */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900">핫딜</h1>
          <p className="text-[11.5px] text-[#B49A6A]">빈 시간대를 할인으로 채우기 — 손님 앱에 실시간 노출</p>
        </div>
        <div className="ml-auto flex rounded-xl border border-[#F0E6D2] bg-white p-1">
          {([
            { k: "deals", l: "🔥 내 핫딜" },
            { k: "perf", l: "📈 성과" },
            { k: "benefits", l: "🎁 혜택 보관함" },
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
          { l: "노출 중", v: `${activeRules.length}개`, hot: activeRules.length > 0 },
          { l: "노출 (30일)", v: `${totals?.impressions ?? 0}`, hot: false },
          { l: "클릭", v: `${totals?.clicks ?? 0}`, hot: false },
          { l: "핫딜 예약", v: `${totals?.reservations ?? 0}건`, hot: false },
        ].map((k) => (
          <div key={k.l} className={`rounded-2xl border bg-white p-3 text-center ${k.hot ? "border-[#F5A623]" : "border-[#F0E6D2]"}`}>
            <div className={`text-[15px] font-bold ${k.hot ? "text-[#854F0B]" : "text-slate-900"}`}>{k.v}</div>
            <div className="text-[10px] text-[#B49A6A]">{k.l}</div>
          </div>
        ))}
      </div>

      {/* ─────────────── 🔥 내 핫딜 ─────────────── */}
      {tab === "deals" && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[12px] font-bold text-slate-700">노출 중 {activeRules.length}</span>
            <span className="ml-auto flex gap-2">
              <button
                onClick={() => router.push(`/stores/${resolvedStoreId}/offers/simulator`)}
                className="rounded-xl border border-[#F0E6D2] bg-white px-3 py-2 text-[11.5px] font-semibold text-slate-600 hover:border-[#F5A623]"
              >
                👀 손님 화면 미리보기
              </button>
              <button
                onClick={() => router.push(`/stores/${resolvedStoreId}/offers/rules/new`)}
                className="rounded-xl bg-[#F5A623] px-4 py-2 text-[11.5px] font-bold text-white hover:bg-[#e09415]"
              >
                + 새 핫딜
              </button>
            </span>
          </div>

          {rules.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-12 text-center">
              <div className="text-2xl">🔥</div>
              <p className="mt-2 text-sm text-slate-500">아직 핫딜이 없어요.</p>
              <p className="mt-1 text-[11px] text-slate-400">한산한 시간대에 딜을 걸면 손님 앱에 노출돼요.</p>
              <button
                onClick={() => router.push(`/stores/${resolvedStoreId}/offers/rules/new`)}
                className="mt-3 rounded-xl bg-[#F5A623] px-4 py-2 text-[12px] font-bold text-white"
              >
                + 첫 핫딜 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {[...activeRules, ...inactiveRules].map((rule) => {
                const p = perfByRule.get(String(rule.id));
                return (
                  <div
                    key={String(rule.id)}
                    className={`rounded-2xl border bg-white p-3.5 ${rule.enabled ? "border-[#F0E6D2]" : "border-[#F0E6D2] opacity-60"}`}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {/* 토글 스위치 */}
                      <button
                        onClick={() => toggleRule(rule.id)}
                        aria-label={rule.enabled ? "끄기" : "켜기"}
                        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${rule.enabled ? "bg-emerald-500" : "bg-slate-300"}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${rule.enabled ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                      <b className="text-[13px] font-semibold text-slate-900">{rule.name}</b>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {rule.enabled ? "노출 중" : "꺼짐"}
                      </span>
                      <span className="ml-auto flex gap-1.5 text-[11px]">
                        <button onClick={() => router.push(`/stores/${resolvedStoreId}/offers/rules/${rule.id}/edit`)} className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                          수정
                        </button>
                        <button onClick={() => handleDelete(rule.id)} className="rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-500">
                          삭제
                        </button>
                      </span>
                    </div>

                    {/* 조건 칩 */}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="rounded-md bg-[#FAEEDA] px-1.5 py-0.5 text-[10px] font-medium text-[#854F0B]">{formatDays(rule.days ?? [])}</span>
                      <span className="rounded-md bg-[#FAEEDA] px-1.5 py-0.5 text-[10px] text-[#854F0B]">{formatBlocks(rule.time_blocks ?? [])}</span>
                      <span className="rounded-md bg-[#FAEEDA] px-1.5 py-0.5 text-[10px] text-[#854F0B]">
                        {rule.party_min || rule.party_max ? `${rule.party_min ?? 1}–${rule.party_max ?? "∞"}인` : "인원 무관"}
                      </span>
                      {rule.benefit_title && (
                        <span className="rounded-md bg-[#FAEEDA] px-1.5 py-0.5 text-[10px] font-medium text-[#854F0B]">🎁 {rule.benefit_title}</span>
                      )}
                      {p && p.inventory_cap > 0 && (
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${(p.remaining ?? 0) <= 2 ? "bg-rose-50 text-rose-600" : "bg-[#FAEEDA] text-[#854F0B]"}`}>
                          잔여 {p.remaining ?? 0}/{p.inventory_cap}
                        </span>
                      )}
                    </div>

                    {/* 성과 한 줄 — 이 딜이 일하고 있는지 */}
                    {rule.enabled && p && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-2.5 border-t border-[#F5EBD8] pt-2 text-[11px] text-slate-500">
                        <span>노출 <b className="text-slate-800">{p.impressions}</b></span>
                        <span className="text-[#E0D5BC]">→</span>
                        <span>클릭 <b className="text-slate-800">{p.clicks}</b></span>
                        <span className="text-[#E0D5BC]">→</span>
                        <span>예약 <b className="text-emerald-700">{p.reservations}건</b></span>
                        {p.deposit_sum > 0 && <span className="text-slate-400">· 예약금 {p.deposit_sum.toLocaleString()}원</span>}
                        {p.conversion != null && (
                          <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${p.conversion >= 0.015 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                            전환 {(p.conversion * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─────────────── 📈 성과 ─────────────── */}
      {tab === "perf" && (
        <>
          {/* 전체 퍼널 */}
          <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
            <div className="text-[12px] font-semibold text-slate-700">전체 퍼널 <span className="font-normal text-[#B49A6A]">· 최근 30일</span></div>
            {!totals || totals.impressions === 0 ? (
              <p className="py-6 text-center text-[12px] text-slate-400">아직 노출 데이터가 없어요. 핫딜을 켜면 손님 앱에 노출됩니다.</p>
            ) : (
              <div className="mt-3 flex items-end gap-3">
                {[
                  { l: "노출", v: totals.impressions, c: "#FCE3B8" },
                  { l: "클릭", v: totals.clicks, c: "#F5A623" },
                  { l: "예약", v: totals.reservations, c: "#1D9E75" },
                  { l: "예약금", v: totals.deposit_sum, c: "#0F6E56", money: true },
                ].map((s, i, arr) => {
                  const max = Math.max(...arr.map((x) => (x.money ? 0 : x.v)), 1);
                  const h = s.money ? 18 : Math.max(14, Math.round((s.v / max) * 72));
                  return (
                    <div key={s.l} className="flex-1 text-center">
                      <div className="mx-auto w-full rounded-t-lg" style={{ height: h, backgroundColor: s.c }} />
                      <div className="mt-1.5 text-[10px] text-slate-500">{s.l}</div>
                      <div className={`text-[13px] font-bold ${i >= 2 ? "text-emerald-700" : "text-slate-900"}`}>
                        {s.money ? `${Math.round(s.v / 10000)}만` : s.v}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 딜별 성과 */}
          <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
            <div className="text-[12px] font-semibold text-slate-700">딜별 성과</div>
            {(perf?.rules?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-[12px] text-slate-400">딜 데이터가 없어요.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {perf!.rules
                  .slice()
                  .sort((a, b) => b.reservations - a.reservations || b.clicks - a.clicks)
                  .map((p) => (
                    <div key={p.rule_id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 ${p.enabled ? "bg-[#FBF6EA]" : "bg-slate-50 opacity-60"}`}>
                      <span className={`h-8 w-1 shrink-0 rounded ${p.enabled ? "bg-[#F5A623]" : "bg-slate-300"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[12.5px] font-semibold text-slate-800">
                          {p.name} {!p.enabled && <span className="font-normal text-slate-400">(꺼짐)</span>}
                        </div>
                        {p.benefit_title && <div className="truncate text-[10.5px] text-slate-400">🎁 {p.benefit_title}</div>}
                      </div>
                      <div className="shrink-0 text-right text-[11px] text-slate-500">
                        {p.impressions} → {p.clicks} → <b className="text-emerald-700">{p.reservations}건</b>
                        {p.conversion != null && <div className="text-[9.5px] text-slate-400">전환 {(p.conversion * 100).toFixed(1)}%</div>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {best && (
              <div className="mt-3 rounded-xl bg-[#FFF9EC] px-3.5 py-2.5 text-[12px] font-medium text-[#854F0B]">
                💡 &lsquo;{best.name}&rsquo; 전환이 제일 좋아요 ({((best.conversion ?? 0) * 100).toFixed(1)}%) — 비슷한 시간대에 하나 더 걸어볼까요?
              </div>
            )}
          </div>
        </>
      )}

      {/* ─────────────── 🎁 혜택 보관함 ─────────────── */}
      {tab === "benefits" && (
        <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-700">혜택 보관함 <span className="font-normal text-[#B49A6A]">· 딜 만들 때 재사용하는 재료</span></span>
            <button
              onClick={() => router.push(`/stores/${resolvedStoreId}/offers/benefits`)}
              className="ml-auto text-[11.5px] font-semibold text-[#B4791B]"
            >
              전체 관리 →
            </button>
          </div>
          {benefits.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-slate-400">
              저장된 혜택이 없어요. &lsquo;전체 관리&rsquo;에서 자주 쓰는 혜택(예: 음료 서비스, 10% 할인)을 만들어두면 딜 발행이 빨라져요.
            </p>
          ) : (
            <div className="mt-2.5 flex flex-wrap gap-2">
              {benefits.map((b: any) => (
                <span key={String(b.id)} className="rounded-full bg-[#FAEEDA] px-3 py-1.5 text-[12px] font-medium text-[#854F0B]">
                  🎁 {b.title}
                </span>
              ))}
              <button
                onClick={() => router.push(`/stores/${resolvedStoreId}/offers/benefits`)}
                className="rounded-full border border-dashed border-[#E0D5BC] px-3 py-1.5 text-[12px] text-[#B49A6A]"
              >
                + 추가
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
