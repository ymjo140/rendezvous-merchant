"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
  revisit_intent: boolean; recent_interest: number; tier: string;
};
type Group = { persona: string; emoji: string; visits: number; last: string; revisit_intent: boolean };
type React2 = { persona: string; emoji: string; taste: string[]; interest: number; last: string };
type Followup = { persona: string; emoji: string; reason: string; draft: string; tier: string };
type Crm = {
  store_cuisine: string | null;
  counts: { customers: number; groups: number; reactivation: number; vip: number };
  customers: Customer[]; groups: Group[]; reactivation: React2[]; followups: Followup[];
};

const AXIS_ORDER = ["맛", "서비스", "가격", "분위기"];
const TIER_STYLE: Record<string, string> = {
  VIP: "bg-violet-100 text-violet-700",
  단골: "bg-emerald-100 text-emerald-700",
  신규: "bg-slate-100 text-slate-500",
};

export function RegularsPage({ storeId }: { storeId?: string }) {
  const [reg, setReg] = useState<Regulars | null>(null);
  const [crm, setCrm] = useState<Crm | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [profileUid, setProfileUid] = useState<number | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    Promise.all([
      fetchWithAuth<Regulars>(`/api/merchant/stores/${storeId}/regulars`).catch(() => null),
      fetchWithAuth<Crm>(`/api/merchant/stores/${storeId}/crm`).catch(() => null),
    ]).then(([r, c]) => {
      setReg(r);
      setCrm(c);
      setLoading(false);
    });
  }, [storeId]);

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

  if (loading) return <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">
          단골 관리 <span className="text-sm font-normal text-slate-400">· 취향 CRM</span>
        </h1>
        <p className="text-sm text-slate-500">
          단순 방문 횟수가 아니라 <b>취향·모임·요즘 관심</b>까지 봐요 — 다른 CRM은 못 하는 것
        </p>
      </div>

      {/* 히어로: 또 오고 싶어한 손님 */}
      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="min-w-[180px] flex-1">
            <div className="text-sm text-emerald-700">
              이번 달 <b>&ldquo;또 오고 싶다&rdquo;</b>고 한 손님
            </div>
            <div className="text-4xl font-bold leading-tight text-emerald-900">
              {reg?.revisit_intent_count ?? 0}
              <span className="text-base font-medium">명</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => reengage("thanks")}
              disabled={sending !== null}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 text-sm font-bold text-emerald-50 hover:bg-emerald-800 disabled:opacity-50"
            >
              🎟️ 감사 쿠폰 보내기
            </button>
            <div className="text-center text-[10px] text-emerald-600">앱으로 발송 · 손님 연락처 없이도 OK</div>
          </div>
        </CardContent>
      </Card>

      {/* 지표 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="재방문율" value={reg?.revisit_rate != null ? `${reg.revisit_rate}%` : "—"} />
        <MiniStat label="단골 후보 (2회+)" value={`${reg?.repeat_count ?? 0}명`} />
        <MiniStat label="VIP (4회+)" value={`${crm?.counts.vip ?? 0}명`} />
        <MiniStat label="뜸해진 단골" value={`${reg?.dormant_count ?? 0}명`} />
      </div>

      {/* #2 리액티베이션 — 지금 재방문 타이밍 (차별점, 상단 배치) */}
      <Card className="border-brand/30">
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-slate-800">
            ⚡ 지금이 재방문 타이밍 <span className="font-normal text-slate-400">· 요즘 우리 카테고리에 관심↑</span>
          </div>
          {(crm?.reactivation?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              아직 신호가 없어요. 손님이 앱에서 우리 같은 가게를 저장·검색하면 여기 뜹니다.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {crm!.reactivation.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-brand-light/40 p-3">
                  <span className="text-lg">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-slate-800">
                      {r.persona} <span className="text-slate-400">· {r.last} 방문</span>
                    </div>
                    <div className="text-[11px] text-brand-dark">
                      요즘 {crm!.store_cuisine ?? "우리 카테고리"} {r.interest}곳 저장 → 지금 부르면 딱
                    </div>
                  </div>
                  {r.taste?.[0] && (
                    <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-slate-500">#{r.taste[0]}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* #4 자동 팔로업 — 누구에게 뭐라고 (초안 제공) */}
      <Card>
        <CardContent className="p-4">
          <div className="text-sm font-semibold text-slate-800">
            ✉️ 자동 팔로업 <span className="font-normal text-slate-400">· 시스템이 대상·메시지까지</span>
          </div>
          {(crm?.followups?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">아직 팔로업 대상이 없어요.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {crm!.followups.map((f, i) => (
                <div key={i} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-2">
                    <span>{f.emoji}</span>
                    <span className="text-sm font-medium text-slate-800">{f.persona}</span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TIER_STYLE[f.tier] ?? ""}`}>
                      {f.tier}
                    </span>
                    <span className="ml-auto text-[11px] text-slate-400">{f.reason}</span>
                  </div>
                  <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[13px] text-slate-700">{f.draft}</div>
                  <div className="mt-1.5 flex justify-end">
                    <button
                      onClick={() => copyDraft(f.draft)}
                      className="rounded-lg border border-slate-200 px-3 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      📋 메시지 복사
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* #1 손님 카드 — 취향 리치 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">손님 카드</div>
              <span className="text-xs text-slate-400">개인정보 없이 취향·모임으로</span>
            </div>
            {(crm?.customers?.length ?? 0) === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                아직 방문 손님 데이터가 없어요.<br />앱 예약·방문이 쌓이면 취향 카드가 생겨요.
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {crm!.customers.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setProfileUid(c.uid)}
                    className="block w-full rounded-xl border border-slate-100 p-3 text-left hover:border-brand/40 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-base">{c.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-slate-800">{c.persona}</span>
                          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TIER_STYLE[c.tier] ?? ""}`}>
                            {c.tier}
                          </span>
                          {c.revisit_intent && <span className="text-[11px]">💛</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {c.visits}회 방문{c.last ? ` · ${c.last}` : ""}
                          {c.recent_interest > 0 && <span className="text-brand"> · 요즘 관심↑</span>}
                        </div>
                      </div>
                    </div>
                    {c.taste.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {c.taste.map((t) => (
                          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">#{t}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* #3 그룹 CRM */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-slate-800">
                그룹 <span className="font-normal text-slate-400">· 모임 단위 관리</span>
              </div>
              {(crm?.groups?.length ?? 0) === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  아직 모임 방문 기록이 없어요.<br />모임 단위로 오면 여기 쌓여요.
                </p>
              ) : (
                <div className="mt-2 divide-y divide-slate-100">
                  {crm!.groups.map((g, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <span className="text-base">{g.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-800">{g.persona}</div>
                        <div className="text-[11px] text-slate-400">{g.visits}회 · {g.last}</div>
                      </div>
                      {g.revisit_intent && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          💛 또갈래요
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 재방문 진단 */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-slate-800">재방문 진단</div>
              {reg?.diagnosis ? (
                <>
                  <div className="mt-2 text-xs leading-relaxed text-slate-600">
                    손님 반응 기준, <b className="text-slate-900">&lsquo;{reg.diagnosis.weak}&rsquo;</b> 만족이 가장 낮아요
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {AXIS_ORDER.filter((a) => reg.diagnosis!.axes[a] != null).map((a) => {
                      const v = reg.diagnosis!.axes[a];
                      const weak = a === reg.diagnosis!.weak;
                      return (
                        <div key={a} className="flex items-center gap-2">
                          <span className="w-10 text-[11px] text-slate-400">{a}</span>
                          <div className="h-1.5 flex-1 rounded bg-slate-100">
                            <div className={`h-full rounded ${weak ? "bg-rose-500" : "bg-emerald-500"}`} style={{ width: `${Math.round((v / 5) * 100)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {reg.diagnosis.hint && <div className="mt-2.5 text-[11px] font-medium text-brand">💡 {reg.diagnosis.hint}</div>}
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">아직 후기가 부족해 진단이 어려워요.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {profileUid != null && (
        <CustomerProfileSheet storeId={storeId} userId={profileUid} onClose={() => setProfileUid(null)} />
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
