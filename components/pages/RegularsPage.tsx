"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchWithAuth } from "@/lib/api/client";
import { toast } from "@/components/ui/toaster";

type Regulars = {
  revisit_intent_count: number;
  revisit_intent: { persona: string; emoji: string; ago: string }[];
  revisit_rate: number | null;
  repeat_count: number;
  dormant_count: number;
  diagnosis: {
    axes: Record<string, number>;
    weak: string;
    hint: string;
    review_count: number;
  } | null;
};

const AXIS_ORDER = ["맛", "서비스", "가격", "분위기"];

export function RegularsPage({ storeId }: { storeId?: string }) {
  const [data, setData] = useState<Regulars | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const load = () => {
    if (!storeId) return;
    setLoading(true);
    fetchWithAuth<Regulars>(`/api/merchant/stores/${storeId}/regulars`)
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [storeId]);

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
      toast("발송에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setSending(null);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>;

  const d = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">
          단골 관리 <span className="text-sm font-normal text-slate-400">· 재방문</span>
        </h1>
        <p className="text-sm text-slate-500">한 번 온 손님을 다시 오게 — 신규 유입보다 싸고 확실해요</p>
      </div>

      {/* 히어로: 또 오고 싶어한 손님 + 감사 쿠폰 */}
      <Card className="border-emerald-200 bg-emerald-50/60">
        <CardContent className="flex flex-wrap items-center gap-4 p-5">
          <div className="min-w-[180px] flex-1">
            <div className="text-sm text-emerald-700">
              이번 달 <b>&ldquo;또 오고 싶다&rdquo;</b>고 한 손님
            </div>
            <div className="text-4xl font-bold leading-tight text-emerald-900">
              {d?.revisit_intent_count ?? 0}
              <span className="text-base font-medium">명</span>
            </div>
            <div className="mt-0.5 text-xs text-emerald-600">
              이들에게 다시 손 내밀면 재방문 확률이 가장 높아요
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

      {/* 지표 3종 */}
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="재방문율" value={d?.revisit_rate != null ? `${d.revisit_rate}%` : "—"} />
        <MiniStat label="단골 후보 (2회+)" value={`${d?.repeat_count ?? 0}명`} />
        <MiniStat label="뜸해진 단골" value={`${d?.dormant_count ?? 0}명`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        {/* 또 오고 싶어한 손님 리스트 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">또 오고 싶어한 손님</div>
              <span className="text-xs text-slate-400">개인정보 없이 모임 유형으로</span>
            </div>
            <div className="mt-2 divide-y divide-slate-100">
              {(d?.revisit_intent?.length ?? 0) === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  아직 재방문 의사를 남긴 손님이 없어요.<br />
                  방문 손님이 다녀간 뒤 설문에 답하면 여기 쌓여요.
                </p>
              ) : (
                d!.revisit_intent.map((v, i) => (
                  <div key={i} className="flex items-center gap-3 py-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-base">
                      {v.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-slate-800">{v.persona}</div>
                      <div className="text-xs text-slate-400">{v.ago} 방문</div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      💛 또갈래요
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* 뜸해진 단골 다시 부르기 */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-slate-800">
                뜸해진 단골 <span className="font-normal text-slate-400">· 다시 부르기</span>
              </div>
              <div className="mt-2 rounded-xl bg-amber-50 p-3">
                <div className="text-[13px] font-medium text-amber-900">
                  3주 이상 안 오신 단골 후보 {d?.dormant_count ?? 0}명
                </div>
                <div className="mt-0.5 text-xs text-amber-700">&ldquo;보고 싶어요&rdquo; 리마인드 + 재방문 쿠폰</div>
                <button
                  onClick={() => reengage("reminder")}
                  disabled={sending !== null || (d?.dormant_count ?? 0) === 0}
                  className="mt-2.5 h-9 w-full rounded-lg bg-amber-600 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-40"
                >
                  {(d?.dormant_count ?? 0) > 0 ? `${d?.dormant_count}명에게 리마인드 보내기` : "대상 손님 없음"}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* 재방문 진단 */}
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-semibold text-slate-800">재방문 진단</div>
              {d?.diagnosis ? (
                <>
                  <div className="mt-2 text-xs leading-relaxed text-slate-600">
                    손님 반응 기준, <b className="text-slate-900">&lsquo;{d.diagnosis.weak}&rsquo;</b> 만족이 가장 낮아요
                  </div>
                  <div className="mt-2 space-y-1.5">
                    {AXIS_ORDER.filter((a) => d.diagnosis!.axes[a] != null).map((a) => {
                      const v = d.diagnosis!.axes[a];
                      const pct = Math.round((v / 5) * 100);
                      const weak = a === d.diagnosis!.weak;
                      return (
                        <div key={a} className="flex items-center gap-2">
                          <span className="w-10 text-[11px] text-slate-400">{a}</span>
                          <div className="h-1.5 flex-1 rounded bg-slate-100">
                            <div
                              className={`h-full rounded ${weak ? "bg-rose-500" : "bg-emerald-500"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {d.diagnosis.hint && (
                    <div className="mt-2.5 text-[11px] font-medium text-brand">💡 {d.diagnosis.hint}</div>
                  )}
                </>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  아직 후기가 부족해 진단이 어려워요. 후기가 쌓이면 약한 축을 짚어드려요.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
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
