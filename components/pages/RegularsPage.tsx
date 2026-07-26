"use client";

// 💛 단골 v2 — "행동/조회/파악" 3서브탭 (크림+앰버 디자인 시스템)
// 📨 보내기: 통일된 액션 큐(대상 N명+이유+버튼) + 재초대 성과 루프
// 👥 손님: 검색+세그먼트+카드(→프로필 시트) + 그룹
// 📊 인사이트: 재방문 진단 4축
// 데이터·발송 API는 기존 그대로 (regulars/crm/reengage/reengage-stats).

import { useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/api/client";
import { toast } from "@/components/ui/toaster";
import { CustomerProfileSheet } from "@/components/crm/CustomerProfileSheet";

type Regulars = {
  revisit_intent_count: number;
  revisit_rate: number | null;
  repeat_count: number;
  dormant_count: number;
  diagnosis: { axes: Record<string, number>; weak: string; hint: string; review_count: number } | null;
};
type Customer = {
  uid: number; persona: string; emoji: string; taste: string[]; visits: number; last: string;
  revisit_intent: boolean; recent_interest: number; tier: string; dormant: boolean;
};
type ReengageStats = { sent: number; returned: number; rate: number | null };
type Group = { persona: string; emoji: string; visits: number; last: string; revisit_intent: boolean };
type React2 = { persona: string; emoji: string; taste: string[]; interest: number; last: string };
type Followup = { persona: string; emoji: string; reason: string; draft: string; tier: string };
type Crm = {
  store_cuisine: string | null;
  counts: { customers: number; groups: number; reactivation: number; vip: number };
  customers: Customer[]; groups: Group[]; reactivation: React2[]; followups: Followup[];
};

type Tab = "send" | "customers" | "insight";

const AXIS_ORDER = ["맛", "서비스", "가격", "분위기"];
const TIER_STYLE: Record<string, string> = {
  VIP: "bg-violet-100 text-violet-700",
  단골: "bg-emerald-100 text-emerald-700",
  신규: "bg-slate-100 text-slate-500",
};

export function RegularsPage({ storeId }: { storeId?: string }) {
  const [tab, setTab] = useState<Tab>("send");
  const [reg, setReg] = useState<Regulars | null>(null);
  const [crm, setCrm] = useState<Crm | null>(null);
  const [stats, setStats] = useState<ReengageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [profileUid, setProfileUid] = useState<number | null>(null);
  const [segment, setSegment] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showReact, setShowReact] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    Promise.all([
      fetchWithAuth<Regulars>(`/api/merchant/stores/${storeId}/regulars`).catch(() => null),
      fetchWithAuth<Crm>(`/api/merchant/stores/${storeId}/crm`).catch(() => null),
      fetchWithAuth<ReengageStats>(`/api/merchant/stores/${storeId}/reengage-stats`).catch(() => null),
    ]).then(([r, c, st]) => {
      setReg(r);
      setCrm(c);
      setStats(st);
      setLoading(false);
    });
  }, [storeId]);

  const SEGMENTS: { key: string; label: string; fn: (c: Customer) => boolean }[] = [
    { key: "all", label: "전체", fn: () => true },
    { key: "vip", label: "VIP", fn: (c) => c.tier === "VIP" },
    { key: "regular", label: "단골", fn: (c) => c.tier === "단골" || c.tier === "VIP" },
    { key: "dormant", label: "😴 뜸함", fn: (c) => c.dormant },
    { key: "intent", label: "💛 또갈래요", fn: (c) => c.revisit_intent },
    { key: "interest", label: "관심↑", fn: (c) => c.recent_interest > 0 },
  ];
  const segFn = SEGMENTS.find((s) => s.key === segment)?.fn ?? (() => true);
  const filteredCustomers = useMemo(() => {
    const q = query.trim();
    return (crm?.customers ?? []).filter(segFn).filter((c) => {
      if (!q) return true;
      const blob = `${c.persona} ${c.taste.join(" ")} ${c.tier}`;
      return blob.includes(q);
    });
  }, [crm, segFn, query]);

  const reengage = async (kind: "thanks" | "reminder") => {
    if (!storeId) return;
    setSending(kind);
    try {
      const r = await fetchWithAuth<{ sent: number; message?: string }>(
        `/api/merchant/stores/${storeId}/regulars/reengage`,
        { method: "POST", body: JSON.stringify({ kind }) }
      );
      if (r.sent > 0) toast(`${r.sent}명에게 알림을 보냈어요!`, "success");
      else toast(r.message || "아직 대상 손님이 없어요.", "info");
    } catch {
      toast("발송에 실패했어요.", "error");
    } finally {
      setSending(null);
    }
  };

  const copyDraft = (text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => toast("메시지를 복사했어요. 카톡·문자로 보내세요.", "success"),
      () => toast("복사에 실패했어요.", "error")
    );
  };

  if (loading)
    return (
      <div className="-m-4 min-h-full bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
        <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>
      </div>
    );

  const reactCount = crm?.reactivation?.length ?? 0;
  const draftCount = crm?.followups?.length ?? 0;

  return (
    <div className="-m-4 min-h-full space-y-3 bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
      {/* 헤더 + 서브탭 */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900">단골</h1>
          <p className="text-[11.5px] text-[#B49A6A]">취향·모임·재방문까지 보는 CRM — 연락처 없이도 앱으로 발송</p>
        </div>
        <div className="ml-auto flex rounded-xl border border-[#F0E6D2] bg-white p-1">
          {([
            { k: "send", l: "📨 보내기" },
            { k: "customers", l: "👥 손님" },
            { k: "insight", l: "📊 인사이트" },
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

      {/* 공통 요약 스트립 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { l: "재방문율", v: reg?.revisit_rate != null ? `${reg.revisit_rate}%` : "—", hot: false },
          { l: "단골 (2회+)", v: `${reg?.repeat_count ?? 0}명`, hot: false },
          { l: "VIP (4회+)", v: `${crm?.counts.vip ?? 0}명`, hot: false },
          { l: "뜸해진 단골", v: `${reg?.dormant_count ?? 0}명`, hot: (reg?.dormant_count ?? 0) > 0 },
        ].map((k) => (
          <div key={k.l} className={`rounded-2xl border bg-white p-3 text-center ${k.hot ? "border-[#F5A623]" : "border-[#F0E6D2]"}`}>
            <div className={`text-[15px] font-bold ${k.hot ? "text-[#854F0B]" : "text-slate-900"}`}>{k.v}</div>
            <div className="text-[10px] text-[#B49A6A]">{k.l}</div>
          </div>
        ))}
      </div>

      {/* ─────────────── 📨 보내기 ─────────────── */}
      {tab === "send" && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[12px] font-bold text-slate-700">오늘 보낼 사람</span>
            <span className="text-[10.5px] text-[#B49A6A]">앱 푸시로 발송 · 손님 연락처 없이 OK</span>
          </div>

          {/* 액션 큐 — 동일 패턴: 숫자 + 이유 + 버튼 하나 */}
          <div className="space-y-2">
            <ActionRow
              n={reg?.revisit_intent_count ?? 0}
              color="text-emerald-700"
              title={'💛 "또 오고 싶다"고 한 손님'}
              desc="방문 후 재방문 의사 표시 · 감사 인사가 단골을 만들어요"
              btn="🎟️ 감사 쿠폰"
              busy={sending === "thanks"}
              onClick={() => reengage("thanks")}
            />
            <div className="rounded-2xl border border-[#F5A623] bg-white p-3.5">
              <div className="flex items-center gap-3">
                <div className="w-12 shrink-0 text-center">
                  <div className="text-[20px] font-bold leading-tight text-[#854F0B]">{reactCount}</div>
                  <div className="text-[9px] text-[#B49A6A]">명</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-slate-800">⚡ 지금이 재방문 타이밍</div>
                  <div className="text-[11px] text-slate-500">요즘 {crm?.store_cuisine ?? "우리 카테고리"}에 관심↑ · 지금 부르면 전환율 최고</div>
                </div>
                <button
                  onClick={() => setShowReact(!showReact)}
                  disabled={reactCount === 0}
                  className="shrink-0 rounded-xl border border-[#F0E6D2] px-3.5 py-2 text-[11.5px] font-semibold text-slate-600 disabled:opacity-40"
                >
                  {showReact ? "접기" : "목록 보기"}
                </button>
              </div>
              {showReact && reactCount > 0 && (
                <div className="mt-2.5 space-y-1.5 border-t border-[#F5EBD8] pt-2.5">
                  {crm!.reactivation.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-xl bg-[#FFF9EC] px-3 py-2">
                      <span className="text-base">{r.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12.5px] font-medium text-slate-800">
                          {r.persona} <span className="text-slate-400">· {r.last} 방문</span>
                        </div>
                        <div className="text-[10.5px] text-[#854F0B]">요즘 {crm!.store_cuisine ?? "우리 카테고리"} {r.interest}곳 저장</div>
                      </div>
                      {r.taste?.[0] && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">#{r.taste[0]}</span>}
                    </div>
                  ))}
                  <p className="pt-1 text-[10px] text-slate-400">💡 이 손님들은 💛/😴 발송 대상에 포함돼요 — 아래 초안으로 개별 메시지도 가능</p>
                </div>
              )}
            </div>
            <ActionRow
              n={reg?.dormant_count ?? 0}
              color="text-[#993C1D]"
              title="😴 뜸해진 단골"
              desc="2회+ 방문했는데 3주 넘게 안 옴 · 잊히기 전에 다시 불러요"
              btn="🎁 컴백 쿠폰"
              busy={sending === "reminder"}
              onClick={() => reengage("reminder")}
            />
          </div>

          {/* 맞춤 메시지 초안 (복사해서 카톡·문자) */}
          <div className="rounded-2xl border border-[#F0E6D2] bg-white p-3.5">
            <button onClick={() => setShowDrafts(!showDrafts)} className="flex w-full items-center gap-2">
              <span className="text-[12px] font-semibold text-slate-700">✉️ 맞춤 메시지 초안 {draftCount > 0 && <span className="text-[#B49A6A]">{draftCount}</span>}</span>
              <span className="ml-auto text-[11px] text-slate-400">{showDrafts ? "접기 ▲" : "펼치기 ▼"}</span>
            </button>
            {showDrafts && (
              <div className="mt-2.5 space-y-2 border-t border-[#F5EBD8] pt-2.5">
                {draftCount === 0 ? (
                  <p className="py-3 text-center text-[11.5px] text-slate-400">아직 초안 대상이 없어요.</p>
                ) : (
                  crm!.followups.map((f, i) => (
                    <div key={i} className="rounded-xl bg-[#FBF6EA] p-3">
                      <div className="flex items-center gap-2">
                        <span>{f.emoji}</span>
                        <span className="text-[12.5px] font-medium text-slate-800">{f.persona}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TIER_STYLE[f.tier] ?? ""}`}>{f.tier}</span>
                        <span className="ml-auto text-[10.5px] text-slate-400">{f.reason}</span>
                      </div>
                      <div className="mt-1.5 rounded-lg bg-white px-3 py-2 text-[12.5px] text-slate-700">{f.draft}</div>
                      <div className="mt-1.5 flex justify-end">
                        <button onClick={() => copyDraft(f.draft)} className="rounded-lg border border-[#F0E6D2] px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-[#FFF9EC]">
                          📋 복사
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 재초대 성과 — 행동의 피드백 루프 */}
          <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-slate-700">📈 재초대 성과 · 최근 30일</span>
              <span className="ml-auto text-[10.5px] text-[#B49A6A]">보낸 게 효과 있었는지</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              <span className="text-[18px] font-bold text-slate-900">{stats?.sent ?? 0}<span className="ml-1 text-[11px] font-normal text-slate-400">발송</span></span>
              <span className="text-slate-300">→</span>
              <span className="text-[18px] font-bold text-emerald-700">{stats?.returned ?? 0}<span className="ml-1 text-[11px] font-normal text-slate-400">재방문</span></span>
              {stats?.rate != null && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">전환 {stats.rate}%</span>
              )}
              <div className="relative h-1.5 min-w-[120px] flex-1 overflow-hidden rounded bg-[#FAEEDA]">
                <div className="absolute inset-y-0 left-0 rounded bg-[#F5A623]" style={{ width: `${Math.min(100, stats?.rate ?? 0)}%` }} />
              </div>
            </div>
            {(stats?.sent ?? 0) === 0 && (
              <p className="mt-1.5 text-[11px] text-slate-400">쿠폰·리마인드를 보내면 그 손님이 돌아왔는지 여기서 추적돼요.</p>
            )}
          </div>
        </>
      )}

      {/* ─────────────── 👥 손님 ─────────────── */}
      {tab === "customers" && (
        <>
          {/* 검색 */}
          <div className="flex items-center gap-2 rounded-2xl border border-[#F0E6D2] bg-white px-3.5 py-2.5">
            <span className="text-sm text-[#B49A6A]">🔍</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="손님 검색 (페르소나·취향 태그·등급)"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-300">✕</button>
            )}
          </div>

          {/* 세그먼트 칩 */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {SEGMENTS.map((s) => {
              const n = (crm?.customers ?? []).filter(s.fn).length;
              return (
                <button
                  key={s.key}
                  onClick={() => setSegment(s.key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                    segment === s.key ? "bg-[#F5A623] text-white" : "border border-[#F0E6D2] bg-white text-slate-500"
                  }`}
                >
                  {s.label} {n > 0 && <span className={segment === s.key ? "text-amber-100" : "text-slate-400"}>{n}</span>}
                </button>
              );
            })}
          </div>

          {/* 손님 카드 그리드 */}
          {(crm?.customers?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-12 text-center">
              <div className="text-2xl">👥</div>
              <p className="mt-2 text-sm text-slate-500">아직 방문 손님 데이터가 없어요.</p>
              <p className="mt-1 text-[11px] text-slate-400">앱 예약·방문이 쌓이면 취향 카드가 생겨요.</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-10 text-center text-sm text-slate-400">
              이 조건의 손님이 없어요.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
              {filteredCustomers.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setProfileUid(c.uid)}
                  className="rounded-2xl border border-[#F0E6D2] bg-white p-3 text-left transition-colors hover:border-[#F5A623]"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAEEDA] text-lg">{c.emoji}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-slate-800">{c.persona}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TIER_STYLE[c.tier] ?? ""}`}>{c.tier}</span>
                        {c.revisit_intent && <span className="text-[11px]">💛</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {c.visits}회 방문{c.last ? ` · ${c.last}` : ""}
                        {c.dormant && <span className="text-[#993C1D]"> · 😴</span>}
                        {c.recent_interest > 0 && <span className="text-[#B4791B]"> · 관심↑</span>}
                      </div>
                    </div>
                  </div>
                  {c.taste.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {c.taste.slice(0, 4).map((t) => (
                        <span key={t} className="rounded-full bg-[#FAEEDA] px-2 py-0.5 text-[10px] text-[#854F0B]">#{t}</span>
                      ))}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 그룹(단체 손님) */}
          <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
            <div className="text-[12px] font-semibold text-slate-700">👥 단체 손님 <span className="font-normal text-[#B49A6A]">· 모임 단위</span></div>
            {(crm?.groups?.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-[11.5px] text-slate-400">아직 모임 방문 기록이 없어요. 모임 단위로 오면 여기 쌓여요.</p>
            ) : (
              <div className="mt-1 divide-y divide-[#F5EBD8]">
                {crm!.groups.map((g, i) => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <span className="text-base">{g.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-slate-800">{g.persona}</div>
                      <div className="text-[11px] text-slate-400">{g.visits}회 · {g.last}</div>
                    </div>
                    {g.revisit_intent && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">💛 또갈래요</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ─────────────── 📊 인사이트 ─────────────── */}
      {tab === "insight" && (
        <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
          <div className="text-[12px] font-semibold text-slate-700">재방문 진단 <span className="font-normal text-[#B49A6A]">· 손님 반응 기준 4축</span></div>
          {reg?.diagnosis ? (
            <>
              <p className="mt-2 text-[13px] text-slate-600">
                <b className="text-slate-900">&lsquo;{reg.diagnosis.weak}&rsquo;</b> 만족이 가장 낮아요 — 여기를 올리면 재방문율이 움직여요.
              </p>
              <div className="mt-3 space-y-2.5">
                {AXIS_ORDER.filter((a) => reg.diagnosis!.axes[a] != null).map((a) => {
                  const v = reg.diagnosis!.axes[a];
                  const weak = a === reg.diagnosis!.weak;
                  return (
                    <div key={a} className="flex items-center gap-3">
                      <span className={`w-12 text-[12px] ${weak ? "font-bold text-[#993C1D]" : "text-slate-500"}`}>{a}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded bg-[#FAEEDA]">
                        <div className={`h-full rounded ${weak ? "bg-[#E24B4A]" : "bg-[#F5A623]"}`} style={{ width: `${Math.round((v / 5) * 100)}%` }} />
                      </div>
                      <span className="w-8 text-right text-[11px] font-semibold text-slate-600">{v.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
              {reg.diagnosis.hint && (
                <div className="mt-3 rounded-xl bg-[#FFF9EC] px-3 py-2.5 text-[12px] font-medium text-[#854F0B]">💡 {reg.diagnosis.hint}</div>
              )}
              <p className="mt-2 text-[10.5px] text-slate-400">후기 {reg.diagnosis.review_count}건 기준</p>
            </>
          ) : (
            <p className="py-6 text-center text-[12px] text-slate-400">아직 후기가 부족해 진단이 어려워요. 방문 후기가 쌓이면 4축 진단이 열려요.</p>
          )}
        </div>
      )}

      {profileUid != null && (
        <CustomerProfileSheet storeId={storeId} userId={profileUid} onClose={() => setProfileUid(null)} />
      )}
    </div>
  );
}

// 액션 큐 공통 행 — "대상 N명 + 한 줄 이유 + 버튼 하나" 패턴 고정
function ActionRow({
  n, color, title, desc, btn, busy, onClick,
}: {
  n: number; color: string; title: string; desc: string; btn: string; busy: boolean; onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[#F0E6D2] bg-white p-3.5">
      <div className="flex items-center gap-3">
        <div className="w-12 shrink-0 text-center">
          <div className={`text-[20px] font-bold leading-tight ${color}`}>{n}</div>
          <div className="text-[9px] text-[#B49A6A]">명</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-800">{title}</div>
          <div className="text-[11px] text-slate-500">{desc}</div>
        </div>
        <button
          onClick={onClick}
          disabled={busy || n === 0}
          className="shrink-0 rounded-xl bg-[#F5A623] px-3.5 py-2 text-[11.5px] font-bold text-white hover:bg-[#e09415] disabled:opacity-40"
        >
          {busy ? "발송 중…" : btn}
        </button>
      </div>
    </div>
  );
}
