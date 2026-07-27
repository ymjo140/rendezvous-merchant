"use client";

// 🤝 제휴 v2 — 신청 검토(기본)/내 딜/성과 3서브탭 (크림+앰버 디자인 시스템)
// 신청 검토: 판단 근거(인증·규모·활동·재방문율)가 카드에 다 있는 승인 큐
// 내 딜: 템플릿 프리셋 4개로 10초 발행 시트 / 성과: 크루별 기여 랭킹

import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchWithAuth } from "@/lib/api/client";
import { toast } from "@/components/ui/toaster";

type CrewSnap = {
  id: string; title: string; icon: string; members: number;
  crew_type?: string; org_name?: string | null; verified_members?: number;
  visits_total?: number; revisit_rate?: number | null;
};
type AppRow = {
  id: number; status: string; message: string; created_at: string | null;
  direction?: string;   // crew_apply=크루가 신청 / store_invite=내가 보낸 제안
  crew: CrewSnap;
};
type Deal = {
  uses_this_month?: number;   // 이번 달 이 딜로 나간 할인 횟수(크루-일 기준)
  id: number; title: string; benefit: string; discount_pct: number | null;
  target: string; conditions: Record<string, any>; status: string;
  pending: number; approved: number; applications: AppRow[];
};
type ByCrew = {
  id: string; title: string; icon: string; visits: number; amount: number; revisits: number;
  deal_uses?: number;   // 그 방문 중 실제로 할인이 나간 횟수
};
type Resp = {
  deals: Deal[];
  performance: {
    approved_crews: number; visits: number; amount: number; revisits: number;
    deal_uses?: number; by_crew?: ByCrew[];
  };
};

type Tab = "apps" | "deals" | "perf";

// 제안 후보 크루 — 우리 가게에 온 적 있는 크루가 위로
type Candidate = {
  id: string; title: string; icon: string; members: number;
  crew_type?: string; org_name?: string | null;
  visits: number; amount: number; last_visit: string;
};

const TARGET_LABEL: Record<string, string> = { all: "모든 자격 크루", university: "🎓 대학 크루만", company: "🏢 직장 크루만" };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_KO: Record<string, string> = { mon: "월", tue: "화", wed: "수", thu: "목", fri: "금", sat: "토", sun: "일" };
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2), m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

type DealForm = {
  title: string; benefit: string; discount_pct: string; target: string;
  days: string[]; time_from: string; time_to: string; min_party: string;
  duration_months: string; max_members: string; monthly_uses: string;
};
const EMPTY_FORM: DealForm = { title: "", benefit: "", discount_pct: "", target: "all", days: [], time_from: "", time_to: "", min_party: "",
  duration_months: "3", max_members: "", monthly_uses: "" };

// 템플릿 프리셋 — 선택하면 폼이 채워지고 수정만 하면 발행
const TEMPLATES: { key: string; emoji: string; name: string; hint: string; form: DealForm }[] = [
  {
    key: "dinner", emoji: "🥂", name: "평일 저녁 단체", hint: "월–목 17–19시 · 4인+ · 15%",
    form: { title: "평일 저녁 단체 15%", benefit: "전 메뉴 15% 할인", discount_pct: "15", target: "all", days: ["mon", "tue", "wed", "thu"], time_from: "17:00", time_to: "19:00", min_party: "4", duration_months: "3", max_members: "", monthly_uses: "" },
  },
  {
    key: "late", emoji: "🍺", name: "심야 음료 서비스", hint: "21시 이후 · 3인+",
    form: { title: "심야 단체 음료 서비스", benefit: "단체 방문 시 음료 1병 서비스", discount_pct: "", target: "all", days: [], time_from: "21:00", time_to: "", min_party: "3", duration_months: "3", max_members: "", monthly_uses: "" },
  },
  {
    key: "univ", emoji: "🎓", name: "대학생 응원", hint: "대학 크루 전용 · 20%",
    form: { title: "시험기간 대학생 응원 20%", benefit: "대학 크루 전 메뉴 20% 할인", discount_pct: "20", target: "university", days: [], time_from: "", time_to: "", min_party: "2", duration_months: "3", max_members: "", monthly_uses: "" },
  },
  { key: "custom", emoji: "✏️", name: "직접 만들기", hint: "조건 자유 설정", form: EMPTY_FORM },
];

function condChips(c: Record<string, any>): string[] {
  const out: string[] = [];
  if (Array.isArray(c.days) && c.days.length) out.push(c.days.map((d: string) => DAY_KO[d] || d).join("·"));
  if (c.time_from || c.time_to) out.push(`${c.time_from || ""}–${c.time_to || "마감"}`);
  if (c.min_party) out.push(`${c.min_party}인+`);
  if (c.max_members) out.push(`크루 ${c.max_members}명까지`);
  if (c.monthly_uses) out.push(`월 ${c.monthly_uses}회`);
  return out;
}

export function PartnershipsPage({ storeId }: { storeId?: string }) {
  const [tab, setTab] = useState<Tab>("apps");
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [showEnded, setShowEnded] = useState(false);

  // 크루에 제안 시트
  const [inviteFor, setInviteFor] = useState<Deal | null>(null);
  const [cands, setCands] = useState<Candidate[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [inviteMsg, setInviteMsg] = useState("");

  // 새 딜 시트
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tpl, setTpl] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>(EMPTY_FORM);

  const load = useCallback(() => {
    if (!storeId) return;
    fetchWithAuth<Resp>(`/api/merchant/stores/${storeId}/partnerships`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  // 신청 평탄화 — 딜 안에 묻혀 있던 걸 큐로
  const allApps = useMemo(() => {
    const out: (AppRow & { deal: Deal })[] = [];
    for (const d of data?.deals ?? []) for (const a of d.applications) out.push({ ...a, deal: d });
    out.sort((x, y) => (y.created_at || "").localeCompare(x.created_at || ""));
    return out;
  }, [data]);
  const isInvite = (a: AppRow) => (a.direction || "crew_apply") === "store_invite";
  // 할 일 = 크루가 낸 신청만. 내가 보낸 제안은 크루의 응답을 기다리는 것이라 따로 본다.
  const pendingApps = allApps.filter((a) => a.status === "pending" && !isInvite(a));
  const sentInvites = allApps.filter((a) => a.status === "pending" && isInvite(a));
  const doneApps = allApps.filter((a) => a.status !== "pending");

  const activeDeals = (data?.deals ?? []).filter((d) => d.status !== "ended");
  const endedDeals = (data?.deals ?? []).filter((d) => d.status === "ended");
  const perf = data?.performance;

  const decide = async (aid: number, approve: boolean) => {
    try {
      await fetchWithAuth(`/api/merchant/partnership-apps/${aid}/decide`, { method: "POST", body: JSON.stringify({ approve }) });
      toast(approve ? "승인했어요 — 크루에게 바로 안내됩니다." : "거절했어요.", "success");
      load();
    } catch { toast("처리에 실패했어요.", "error"); }
  };

  const setStatus = async (pid: number, status: string) => {
    try {
      await fetchWithAuth(`/api/merchant/partnerships/${pid}/status`, { method: "POST", body: JSON.stringify({ status }) });
      load();
    } catch { toast("변경에 실패했어요.", "error"); }
  };

  const createDeal = async () => {
    if (!storeId || busy) return;
    if (!form.title.trim() || !form.benefit.trim()) { toast("제목과 혜택을 입력해주세요.", "error"); return; }
    setBusy(true);
    try {
      await fetchWithAuth(`/api/merchant/stores/${storeId}/partnerships`, {
        method: "POST",
        body: JSON.stringify({
          title: form.title.trim(),
          benefit: form.benefit.trim(),
          discount_pct: form.discount_pct ? Number(form.discount_pct) : null,
          target: form.target,
          conditions: {
            ...(form.days.length ? { days: form.days } : {}),
            ...(form.time_from ? { time_from: form.time_from } : {}),
            ...(form.time_to ? { time_to: form.time_to } : {}),
            ...(form.min_party ? { min_party: Number(form.min_party) } : {}),
          },
          duration_months: Number(form.duration_months) || 3,
          ...(form.max_members ? { max_members: Number(form.max_members) } : {}),
          ...(form.monthly_uses ? { monthly_uses: Number(form.monthly_uses) } : {}),
        }),
      });
      toast("제휴 딜을 발행했어요 — 자격 크루들에게 노출됩니다.", "success");
      setSheetOpen(false); setTpl(null); setForm(EMPTY_FORM);
      setTab("deals");
      load();
    } catch { toast("발행에 실패했어요.", "error"); } finally { setBusy(false); }
  };

  const openInvite = async (d: Deal) => {
    setInviteFor(d); setCands(null); setPicked([]); setInviteMsg("");
    try {
      const r = await fetchWithAuth<{ items: Candidate[] }>(
        `/api/merchant/stores/${storeId}/crew-candidates?partnership_id=${d.id}`
      );
      setCands(r.items || []);
    } catch { setCands([]); }
  };

  const sendInvite = async () => {
    if (!inviteFor || picked.length === 0 || busy) return;
    setBusy(true);
    try {
      const r = await fetchWithAuth<{ sent: number; skipped: number }>(
        `/api/merchant/partnerships/${inviteFor.id}/invite`,
        { method: "POST", body: JSON.stringify({ community_ids: picked, message: inviteMsg.trim() || undefined }) }
      );
      toast(`${r.sent}개 크루에 제안을 보냈어요 — 수락하면 바로 제휴가 시작됩니다.`, "success");
      setInviteFor(null); load();
    } catch { toast("제안 발송에 실패했어요.", "error"); } finally { setBusy(false); }
  };

  if (loading)
    return (
      <div className="-m-4 min-h-full bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
        <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>
      </div>
    );

  return (
    <div className="-m-4 min-h-full space-y-3 bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
      {/* 헤더 + 서브탭 */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900">제휴</h1>
          <p className="text-[11.5px] text-[#B49A6A]">인증 크루의 단체 고정 수요를 연결 — 광고비 대신 할인으로</p>
        </div>
        <div className="ml-auto flex rounded-xl border border-[#F0E6D2] bg-white p-1">
          {([
            { k: "apps", l: "📥 신청 검토", badge: pendingApps.length },
            { k: "deals", l: "🎫 내 딜", badge: 0 },
            { k: "perf", l: "📈 성과", badge: 0 },
          ] as { k: Tab; l: string; badge: number }[]).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                tab === t.k ? "bg-[#F5A623] text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.l}
              {t.badge > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${tab === t.k ? "bg-white text-[#854F0B]" : "bg-[#F5A623] text-white"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 스트립 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { l: "제휴 크루", v: `${perf?.approved_crews ?? 0}팀`, hot: false },
          { l: "대기 신청", v: `${pendingApps.length}건`, hot: pendingApps.length > 0 },
          { l: "제휴 방문(결제)", v: `${perf?.visits ?? 0}회`, hot: false },
          { l: "제휴 매출", v: `${(perf?.amount ?? 0).toLocaleString()}원`, hot: false },
        ].map((k) => (
          <div key={k.l} className={`rounded-2xl border bg-white p-3 text-center ${k.hot ? "border-[#F5A623]" : "border-[#F0E6D2]"}`}>
            <div className={`truncate text-[15px] font-bold ${k.hot ? "text-[#854F0B]" : "text-slate-900"}`}>{k.v}</div>
            <div className="text-[10px] text-[#B49A6A]">{k.l}</div>
          </div>
        ))}
      </div>

      {/* ─────────────── 📥 신청 검토 ─────────────── */}
      {tab === "apps" && (
        <>
          <div className="pt-1 text-[12px] font-bold text-slate-700">대기 중인 신청 {pendingApps.length}</div>
          {pendingApps.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-12 text-center">
              <div className="text-2xl">📭</div>
              <p className="mt-2 text-sm text-slate-500">대기 중인 신청이 없어요.</p>
              <p className="mt-1 text-[11px] text-slate-400">딜을 발행하면 자격 크루가 신청할 수 있고, 우리 가게에 온 적 있는 크루에게 먼저 제안할 수도 있어요.</p>
              <button onClick={() => { setTab("deals"); setSheetOpen(true); }} className="mt-3 rounded-xl bg-[#F5A623] px-4 py-2 text-[12px] font-bold text-white">
                + 첫 딜 발행하기
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingApps.map((a) => (
                <div key={a.id} className="rounded-2xl border border-[#F5A623] bg-white p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAEEDA] text-lg">{a.crew.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <b className="text-[13px] font-semibold text-slate-900">{a.crew.title}</b>
                        {a.crew.org_name ? (
                          <span className="rounded bg-[#FAEEDA] px-1.5 py-0.5 text-[9.5px] font-bold text-[#854F0B]">
                            {a.crew.crew_type === "university" ? "🎓" : "🏢"} {a.crew.org_name} 인증 {a.crew.verified_members}명
                          </span>
                        ) : (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9.5px] font-bold text-emerald-700">
                            🤝 활동 인증 · 방문 {a.crew.visits_total ?? 0}회
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        멤버 {a.crew.members} · 함께 방문 {a.crew.visits_total ?? 0}회
                        {a.crew.revisit_rate != null && <> · 재방문율 <b className="text-slate-700">{a.crew.revisit_rate}%</b></>}
                        {a.message && <span className="text-slate-400"> · &ldquo;{a.message}&rdquo;</span>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-[#FBF6EA] px-3 py-2">
                    <span className="shrink-0 text-[10px] text-[#B49A6A]">신청 딜</span>
                    <span className="truncate text-[11.5px] font-semibold text-[#854F0B]">
                      {a.deal.title} · {condChips(a.deal.conditions).join(" · ") || "조건 없음"}
                    </span>
                  </div>
                  <div className="mt-2.5 flex justify-end gap-2">
                    <button onClick={() => decide(a.id, false)} className="rounded-xl bg-slate-100 px-4 py-2 text-[11.5px] font-semibold text-slate-500">
                      거절
                    </button>
                    <button onClick={() => decide(a.id, true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-[11.5px] font-bold text-white hover:bg-emerald-700">
                      ✓ 승인 — 크루에 바로 안내
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sentInvites.length > 0 && (
            <div className="rounded-2xl border border-[#F0E6D2] bg-white p-3.5">
              <div className="text-[11.5px] font-semibold text-slate-600">
                보낸 제안 {sentInvites.length}건 · 크루 응답 대기
              </div>
              <div className="mt-2 space-y-1.5 border-t border-[#F5EBD8] pt-2">
                {sentInvites.map((a) => (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-xl bg-[#FBF6EA] px-3 py-2">
                    <span className="text-base">{a.crew.icon}</span>
                    <span className="min-w-0 flex-1 truncate text-[12px] text-slate-700">
                      {a.crew.title} <span className="text-slate-400">· {a.deal.title}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#FAEEDA] px-2 py-0.5 text-[10px] font-bold text-[#854F0B]">대기</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {doneApps.length > 0 && (
            <div className="rounded-2xl border border-[#F0E6D2] bg-white p-3.5">
              <button onClick={() => setShowDone(!showDone)} className="flex w-full items-center text-[11.5px] text-slate-500">
                처리 완료 {doneApps.length}건
                <span className="ml-auto">{showDone ? "접기 ▲" : "펼치기 ▼"}</span>
              </button>
              {showDone && (
                <div className="mt-2 space-y-1.5 border-t border-[#F5EBD8] pt-2">
                  {doneApps.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 rounded-xl bg-[#FBF6EA] px-3 py-2">
                      <span className="text-base">{a.crew.icon}</span>
                      <span className="min-w-0 flex-1 truncate text-[12px] text-slate-700">{a.crew.title} <span className="text-slate-400">· {a.deal.title}</span></span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${a.status === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                        {a.status === "approved" ? (isInvite(a) ? "제안 수락됨" : "승인됨") : isInvite(a) ? "제안 거절됨" : "거절됨"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─────────────── 🎫 내 딜 ─────────────── */}
      {tab === "deals" && (
        <>
          <div className="flex items-center pt-1">
            <span className="text-[12px] font-bold text-slate-700">진행 중 {activeDeals.length}</span>
            <button onClick={() => { setSheetOpen(true); setTpl(null); setForm(EMPTY_FORM); }} className="ml-auto rounded-xl bg-[#F5A623] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#e09415]">
              + 새 딜
            </button>
          </div>

          {activeDeals.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-12 text-center">
              <div className="text-2xl">🤝</div>
              <p className="mt-2 text-sm text-slate-500">아직 진행 중인 딜이 없어요.</p>
              <p className="mt-1 text-[11px] text-slate-400">빈 시간대에 딜을 걸면 공실이 단체 손님으로 바뀌어요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeDeals.map((d) => (
                <div key={d.id} className="rounded-2xl border border-[#F0E6D2] bg-white p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${d.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {d.status === "active" ? "진행 중" : "일시정지"}
                    </span>
                    <b className="text-[13px] font-semibold text-slate-900">{d.title}</b>
                    <span className="ml-auto flex gap-1.5 text-[11px]">
                      {d.status === "active" && (
                        <button onClick={() => openInvite(d)} className="rounded-lg bg-[#F5A623] px-2.5 py-1 font-bold text-white hover:bg-[#e09415]">
                          크루에 제안
                        </button>
                      )}
                      <button onClick={() => setStatus(d.id, d.status === "active" ? "paused" : "active")} className="rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                        {d.status === "active" ? "일시정지" : "재개"}
                      </button>
                      <button onClick={() => { if (window.confirm("딜을 종료할까요?")) setStatus(d.id, "ended"); }} className="rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-500">
                        종료
                      </button>
                    </span>
                  </div>
                  <div className="mt-1.5 text-[12.5px] text-slate-700">🎁 {d.benefit}{d.discount_pct ? ` (${d.discount_pct}%)` : ""}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <span className="rounded-md bg-[#FAEEDA] px-1.5 py-0.5 text-[10px] font-medium text-[#854F0B]">{TARGET_LABEL[d.target] || d.target}</span>
                    {condChips(d.conditions).map((c, i) => (
                      <span key={i} className="rounded-md bg-[#FAEEDA] px-1.5 py-0.5 text-[10px] text-[#854F0B]">{c}</span>
                    ))}
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-500">
                    제휴 크루 <b className="text-slate-800">{d.approved}팀</b>
                    {d.pending > 0 && <> · 대기 <b className="text-[#854F0B]">{d.pending}건</b></>}
                    {/* 한도는 저장된 숫자가 아니라 실제로 작동한다 — 그걸 보여준다 */}
                    <> · 이번 달 <b className="text-[#854F0B]">
                      {d.uses_this_month ?? 0}
                      {d.conditions?.monthly_uses ? `/${d.conditions.monthly_uses}` : ""}회
                    </b> 사용</>
                  </div>
                </div>
              ))}
            </div>
          )}

          {endedDeals.length > 0 && (
            <div>
              <button onClick={() => setShowEnded(!showEnded)} className="text-[11.5px] text-slate-400">
                종료된 딜 {endedDeals.length} {showEnded ? "▲" : "▼"}
              </button>
              {showEnded && (
                <div className="mt-2 space-y-1.5">
                  {endedDeals.map((d) => (
                    <div key={d.id} className="flex items-center gap-2 rounded-xl border border-[#F0E6D2] bg-white px-3 py-2 opacity-60">
                      <span className="text-[12px] text-slate-600">{d.title}</span>
                      <span className="ml-auto text-[10px] text-slate-400">제휴 {d.approved}팀</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ─────────────── 📈 성과 ─────────────── */}
      {tab === "perf" && (
        <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-slate-700">크루별 기여</span>
            <span className="ml-auto text-[10.5px] text-[#B49A6A]">체크인·분담결제·방문 피드백 자동 집계</span>
          </div>
          {(perf?.by_crew?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-[12px] text-slate-400">
              아직 제휴 방문 데이터가 없어요. 체크인 QR을 계산대에 붙여두면 방문이 여기 쌓여요.
            </p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead>
                  <tr className="text-[10.5px] text-[#B49A6A]">
                    <th className="py-1.5 font-medium">크루</th>
                    <th className="py-1.5 text-right font-medium">방문</th>
                    <th className="py-1.5 text-right font-medium">제휴 사용</th>
                    <th className="py-1.5 text-right font-medium">매출</th>
                    <th className="py-1.5 text-right font-medium">재방문 의사</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5EBD8]">
                  {perf!.by_crew!.map((c, i) => (
                    <tr key={c.id}>
                      <td className="py-2">
                        <span className="mr-1.5 text-[11px] font-bold text-[#F5A623]">{i + 1}</span>
                        <span className="mr-1">{c.icon}</span>
                        <span className="font-medium text-slate-800">{c.title}</span>
                      </td>
                      <td className="py-2 text-right font-semibold text-slate-800">{c.visits}회</td>
                      <td className="py-2 text-right text-[#854F0B]">{c.deal_uses ?? 0}회</td>
                      <td className="py-2 text-right text-slate-700">{c.amount.toLocaleString()}원</td>
                      <td className="py-2 text-right text-emerald-700">{c.revisits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-2 flex items-center gap-4 border-t border-[#F0E6D2] pt-2 text-[11.5px] text-slate-500">
                <span>합계</span>
                <span className="ml-auto font-semibold text-slate-800">
                  방문 {perf!.visits}회 · 제휴 {perf!.deal_uses ?? 0}회 · {perf!.amount.toLocaleString()}원 · 재방문 {perf!.revisits}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────── + 새 딜 시트 ─────────────── */}
      {/* 크루에 제안 시트 — 방문 이력 있는 크루가 위로 */}
      {inviteFor && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setInviteFor(null)}>
          <div className="max-h-[86vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">크루에 제안 보내기</h2>
                <p className="text-[11px] text-[#B49A6A]">{inviteFor.title}</p>
              </div>
              <button onClick={() => setInviteFor(null)} className="ml-auto text-[12px] text-slate-400">닫기</button>
            </div>

            {cands === null ? (
              <p className="py-10 text-center text-[12px] text-slate-400">크루를 찾는 중...</p>
            ) : cands.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-[12.5px] text-slate-500">제안할 만한 크루가 아직 없어요.</p>
                <p className="mt-1 text-[11px] text-slate-400">우리 가게에 방문 기록이 있거나 멤버 3명 이상인 크루가 여기 뜹니다.</p>
              </div>
            ) : (
              <>
                <p className="mt-3 text-[11px] text-[#B49A6A]">
                  우리 가게에 온 적 있는 크루가 위에 있어요 — 이미 아는 맛이라 수락률이 높아요.
                </p>
                <div className="mt-2 space-y-1.5">
                  {cands.map((c) => {
                    const on = picked.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setPicked((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                        className={`flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition-colors ${
                          on ? "border-[#F5A623] bg-[#FFF9EC]" : "border-[#F0E6D2] bg-white"
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FAEEDA] text-base">{c.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <b className="text-[12.5px] font-semibold text-slate-900">{c.title}</b>
                            {c.org_name && (
                              <span className="rounded bg-[#FAEEDA] px-1.5 py-0.5 text-[9.5px] font-bold text-[#854F0B]">
                                {c.crew_type === "university" ? "🎓" : "🏢"} {c.org_name}
                              </span>
                            )}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-slate-500">
                            멤버 {c.members}
                            {c.visits > 0
                              ? ` · 우리 가게 ${c.visits}번 방문 · ${c.amount.toLocaleString()}원`
                              : " · 방문 기록 없음"}
                          </span>
                        </span>
                        <span className={`shrink-0 text-[15px] ${on ? "text-[#F5A623]" : "text-slate-200"}`}>{on ? "✓" : "○"}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3">
                  <label className="text-[11.5px] font-semibold text-slate-600">사장님 한마디 (선택)</label>
                  <textarea
                    value={inviteMsg}
                    onChange={(e) => setInviteMsg(e.target.value.slice(0, 200))}
                    rows={2}
                    placeholder="시험기간에 동아리 뒷풀이 오세요!"
                    className="mt-1 w-full rounded-xl border border-[#F0E6D2] p-2.5 text-[12.5px] outline-none focus:border-[#F5A623]"
                  />
                  <p className="mt-0.5 text-[10.5px] text-[#B49A6A]">크루의 제휴 관리 화면에 그대로 보여요.</p>
                </div>

                <button
                  onClick={sendInvite}
                  disabled={picked.length === 0 || busy}
                  className="mt-3 w-full rounded-xl bg-[#F5A623] py-3 text-[13px] font-bold text-white disabled:opacity-40"
                >
                  {picked.length === 0 ? "크루를 선택해주세요" : `${picked.length}개 크루에 제안 보내기`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSheetOpen(false)}>
          <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold text-slate-900">새 제휴 딜</div>

            {/* 템플릿 프리셋 */}
            <p className="mt-1 text-[11px] text-slate-400">템플릿을 고르면 조건이 채워져요 — 수정 후 발행</p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setTpl(t.key); setForm(t.form); }}
                  className={`rounded-xl border p-2.5 text-left transition-colors ${tpl === t.key ? "border-[#F5A623] bg-[#FFF9EC]" : "border-[#F0E6D2]"}`}
                >
                  <div className="text-[12px] font-semibold text-slate-800">{t.emoji} {t.name}</div>
                  <div className="mt-0.5 text-[10px] text-[#B49A6A]">{t.hint}</div>
                </button>
              ))}
            </div>

            {/* 폼 */}
            <div className="mt-4 space-y-2.5">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={60}
                placeholder="딜 제목"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none" />
              <input value={form.benefit} onChange={(e) => setForm({ ...form, benefit: e.target.value })} maxLength={120}
                placeholder="혜택 (예: 전 메뉴 15% 할인 + 음료 서비스)"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[#F5A623] focus:outline-none" />
              <div className="flex gap-2">
                <input value={form.discount_pct} onChange={(e) => setForm({ ...form, discount_pct: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                  placeholder="할인%" inputMode="numeric"
                  className="w-20 rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none" />
                <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none">
                  <option value="all">모든 자격 크루 (활동 인증 포함)</option>
                  <option value="university">🎓 대학 크루만</option>
                  <option value="company">🏢 직장 크루만</option>
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {DAYS.map((d) => (
                  <button key={d}
                    onClick={() => setForm({ ...form, days: form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d] })}
                    className={`h-8 w-8 rounded-lg text-xs font-semibold ${form.days.includes(d) ? "bg-[#F5A623] text-white" : "bg-slate-100 text-slate-500"}`}>
                    {DAY_KO[d]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <select value={form.time_from} onChange={(e) => setForm({ ...form, time_from: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm focus:outline-none">
                  <option value="">시작 시간</option>
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <span className="text-slate-300">~</span>
                <select value={form.time_to} onChange={(e) => setForm({ ...form, time_to: e.target.value })}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm focus:outline-none">
                  <option value="">종료 시간</option>
                  {TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={form.min_party} onChange={(e) => setForm({ ...form, min_party: e.target.value.replace(/\D/g, "").slice(0, 2) })}
                  placeholder="최소 인원" inputMode="numeric"
                  className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>

            {/* 기간·한도 — 기간 없는 제휴는 사실상 영구 할인이 된다 */}
            <div className="mt-4">
              <label className="text-[12px] font-semibold text-slate-600">기간과 한도</label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {["1", "3", "6", "12"].map((mth) => (
                  <button
                    key={mth}
                    onClick={() => setForm({ ...form, duration_months: mth })}
                    className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors ${
                      form.duration_months === mth
                        ? "border-[#F5A623] bg-[#FFF9EC] text-[#854F0B]"
                        : "border-[#F0E6D2] bg-white text-slate-500"
                    }`}
                  >
                    {mth}개월
                  </button>
                ))}
                <input
                  value={form.max_members}
                  onChange={(e) => setForm({ ...form, max_members: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                  placeholder="크루 최대 인원"
                  inputMode="numeric"
                  className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                />
                <input
                  value={form.monthly_uses}
                  onChange={(e) => setForm({ ...form, monthly_uses: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                  placeholder="월 사용 횟수"
                  inputMode="numeric"
                  className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[10.5px] text-[#B49A6A]">
                기간이 끝나면 자동 종료돼요. 인원·횟수를 비워두면 제한 없음이고, 크루가 수락한 시점의 조건이 그대로 유지돼요.
              </p>
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={() => setSheetOpen(false)} className="w-24 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500">취소</button>
              <button onClick={createDeal} disabled={busy} className="flex-1 rounded-xl bg-[#F5A623] py-2.5 text-sm font-bold text-white disabled:opacity-50">
                {busy ? "발행 중…" : "발행하기"}
              </button>
            </div>
            <p className="mt-2 text-center text-[10.5px] text-slate-400">💡 빈 시간대에 걸면 공실이 단체 손님으로 — 광고비 대신 할인으로 내는 마케팅</p>
          </div>
        </div>
      )}
    </div>
  );
}
