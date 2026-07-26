"use client";

// 🤝 크루 제휴 — 딜 발행 → 크루 신청 검토(인증·활동 실적 기반) → 성과.
// 광고비 대신 할인으로 내는 단체 모객: 대학가 제휴 문화의 플랫폼화.

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api/client";
import { toast } from "@/components/ui/toaster";

type CrewSnap = {
  id: string; title: string; icon: string; members: number;
  crew_type?: string; org_name?: string | null; verified_members?: number; visits_total?: number;
};
type AppRow = { id: number; status: string; message: string; created_at: string | null; crew: CrewSnap };
type Deal = {
  id: number; title: string; benefit: string; discount_pct: number | null;
  target: string; conditions: Record<string, any>; status: string;
  pending: number; approved: number; applications: AppRow[];
};
type Resp = { deals: Deal[]; performance: { approved_crews: number; visits: number; amount: number; revisits: number } };

const TARGET_LABEL: Record<string, string> = { all: "모든 자격 크루", university: "🎓 대학 크루", company: "🏢 직장 크루" };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_KO: Record<string, string> = { mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일" };

function condText(c: Record<string, any>): string {
  const parts: string[] = [];
  if (Array.isArray(c.days) && c.days.length) parts.push(c.days.map((d: string) => DAY_KO[d] || d).join("·"));
  if (c.time_from || c.time_to) parts.push(`${c.time_from || ""}~${c.time_to || ""}`);
  if (c.min_party) parts.push(`${c.min_party}인 이상`);
  return parts.join(" · ") || "조건 없음";
}

export function PartnershipsPage({ storeId }: { storeId?: string }) {
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // 발행 폼
  const [title, setTitle] = useState("");
  const [benefit, setBenefit] = useState("");
  const [pct, setPct] = useState<string>("");
  const [target, setTarget] = useState("all");
  const [days, setDays] = useState<string[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [minParty, setMinParty] = useState<string>("");

  const load = useCallback(() => {
    if (!storeId) return;
    fetchWithAuth<Resp>(`/api/merchant/stores/${storeId}/partnerships`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const createDeal = async () => {
    if (!storeId || busy) return;
    if (!title.trim() || !benefit.trim()) { toast("제목과 혜택을 입력해주세요.", "error"); return; }
    setBusy(true);
    try {
      await fetchWithAuth(`/api/merchant/stores/${storeId}/partnerships`, {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          benefit: benefit.trim(),
          discount_pct: pct ? Number(pct) : null,
          target,
          conditions: {
            ...(days.length ? { days } : {}),
            ...(timeFrom ? { time_from: timeFrom } : {}),
            ...(timeTo ? { time_to: timeTo } : {}),
            ...(minParty ? { min_party: Number(minParty) } : {}),
          },
        }),
      });
      toast("제휴 딜을 발행했어요.", "success");
      setFormOpen(false);
      setTitle(""); setBenefit(""); setPct(""); setDays([]); setTimeFrom(""); setTimeTo(""); setMinParty("");
      load();
    } catch { toast("발행에 실패했어요.", "error"); } finally { setBusy(false); }
  };

  const decide = async (aid: number, approve: boolean) => {
    try {
      await fetchWithAuth(`/api/merchant/partnership-apps/${aid}/decide`, {
        method: "POST", body: JSON.stringify({ approve }),
      });
      toast(approve ? "승인했어요 — 크루에게 안내됩니다." : "거절했어요.", "success");
      load();
    } catch { toast("처리에 실패했어요.", "error"); }
  };

  const setStatus = async (pid: number, status: string) => {
    try {
      await fetchWithAuth(`/api/merchant/partnerships/${pid}/status`, {
        method: "POST", body: JSON.stringify({ status }),
      });
      load();
    } catch { toast("변경에 실패했어요.", "error"); }
  };

  const perf = data?.performance;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900">🤝 크루 제휴</h1>
          <p className="mt-0.5 text-xs text-slate-500">인증된 크루(동아리·직장·동호회)에게 혜택을 걸고, 단체 손님을 정기적으로 받아보세요.</p>
        </div>
        <button
          onClick={() => setFormOpen(!formOpen)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          {formOpen ? "닫기" : "+ 딜 발행"}
        </button>
      </div>

      {/* 성과 요약 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { v: perf?.approved_crews ?? 0, l: "제휴 크루" },
          { v: perf?.visits ?? 0, l: "제휴 방문(결제)" },
          { v: `${(perf?.amount ?? 0).toLocaleString()}원`, l: "제휴 매출" },
          { v: perf?.revisits ?? 0, l: "재방문 의사" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
            <div className="text-lg font-bold text-slate-900">{s.v}</div>
            <div className="text-[11px] text-slate-400">{s.l}</div>
          </div>
        ))}
      </div>

      {/* 발행 폼 */}
      {formOpen && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-bold text-slate-800">새 제휴 딜</div>
          <div className="mt-3 grid gap-2.5">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60}
              placeholder="딜 제목 (예: 평일 저녁 대학 크루 환영)"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-slate-400 focus:outline-none" />
            <input value={benefit} onChange={(e) => setBenefit(e.target.value)} maxLength={120}
              placeholder="혜택 (예: 전 메뉴 15% 할인 + 음료 서비스)"
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-slate-400 focus:outline-none" />
            <div className="flex gap-2">
              <input value={pct} onChange={(e) => setPct(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="할인율(%)" inputMode="numeric"
                className="w-24 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-slate-400 focus:outline-none" />
              <select value={target} onChange={(e) => setTarget(e.target.value)}
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-slate-400 focus:outline-none">
                <option value="all">모든 자격 크루 (활동 인증 포함)</option>
                <option value="university">🎓 대학 크루만</option>
                <option value="company">🏢 직장 크루만</option>
              </select>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DAYS.map((d) => (
                <button key={d}
                  onClick={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}
                  className={`h-8 w-8 rounded-lg text-xs font-semibold ${days.includes(d) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {DAY_KO[d]}
                </button>
              ))}
              <input value={timeFrom} onChange={(e) => setTimeFrom(e.target.value)} placeholder="17:00"
                className="ml-2 w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none" />
              <span className="text-xs text-slate-400">~</span>
              <input value={timeTo} onChange={(e) => setTimeTo(e.target.value)} placeholder="19:00"
                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none" />
              <input value={minParty} onChange={(e) => setMinParty(e.target.value.replace(/\D/g, "").slice(0, 2))}
                placeholder="최소 인원" inputMode="numeric"
                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-xs focus:outline-none" />
            </div>
            <button onClick={createDeal} disabled={busy}
              className="mt-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              발행하기
            </button>
            <p className="text-[11px] text-slate-400">💡 빈 시간대(화·수 저녁 등)에 걸면 공실이 단체 손님으로 바뀝니다. 광고비 대신 할인으로 내는 마케팅이에요.</p>
          </div>
        </div>
      )}

      {/* 딜 목록 + 신청 검토 */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">불러오는 중...</div>
      ) : !data || data.deals.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white py-12 text-center">
          <div className="text-3xl">🤝</div>
          <p className="mt-2 text-sm font-semibold text-slate-700">아직 제휴 딜이 없어요</p>
          <p className="mt-1 text-xs text-slate-400">첫 딜을 발행하면 자격을 갖춘 크루들이 신청할 수 있어요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.deals.map((d) => (
            <div key={d.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  d.status === "active" ? "bg-emerald-100 text-emerald-700"
                  : d.status === "paused" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                }`}>{d.status === "active" ? "진행 중" : d.status === "paused" ? "일시정지" : "종료"}</span>
                <span className="text-sm font-bold text-slate-900">{d.title}</span>
                <span className="ml-auto flex gap-1.5">
                  {d.status !== "ended" && (
                    <>
                      <button onClick={() => setStatus(d.id, d.status === "active" ? "paused" : "active")}
                        className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                        {d.status === "active" ? "일시정지" : "재개"}
                      </button>
                      <button onClick={() => { if (window.confirm("딜을 종료할까요?")) setStatus(d.id, "ended"); }}
                        className="rounded-lg bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-500">종료</button>
                    </>
                  )}
                </span>
              </div>
              <div className="mt-1.5 text-[13px] text-slate-700">🎁 {d.benefit}{d.discount_pct ? ` (${d.discount_pct}%)` : ""}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                {TARGET_LABEL[d.target] || d.target} · {condText(d.conditions)} · 신청 {d.pending} · 승인 {d.approved}
              </div>

              {d.applications.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                  {d.applications.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-lg">{a.crew.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <b className="truncate text-[13px] font-semibold text-slate-900">{a.crew.title}</b>
                          {a.crew.org_name && (
                            <em className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[9.5px] font-bold not-italic text-amber-700">
                              {a.crew.crew_type === "university" ? "🎓" : "🏢"} {a.crew.org_name} 인증 {a.crew.verified_members}명
                            </em>
                          )}
                        </span>
                        <span className="block text-[11px] text-slate-400">
                          멤버 {a.crew.members} · 함께 방문 {a.crew.visits_total ?? 0}회{a.message && ` · "${a.message}"`}
                        </span>
                      </span>
                      {a.status === "pending" ? (
                        <span className="flex shrink-0 gap-1.5">
                          <button onClick={() => decide(a.id, true)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white">승인</button>
                          <button onClick={() => decide(a.id, false)}
                            className="rounded-lg bg-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500">거절</button>
                        </span>
                      ) : (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          a.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                        }`}>{a.status === "approved" ? "승인됨" : "거절됨"}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
