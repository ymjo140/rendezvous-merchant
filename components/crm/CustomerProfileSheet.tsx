"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api/client";
import { toast } from "@/components/ui/toaster";

type Detail = {
  persona: string; emoji: string; tier: string; taste: string[];
  visits: number; last: string; revisit_intent: boolean; recent_interest: number;
  store_cuisine: string | null; brief: string;
  timeline: { ago: string; party: number; revisit: boolean; first: boolean }[];
  reviews: { rating: number | null; comment: string }[];
  memo: string;
};

const TIER_STYLE: Record<string, string> = {
  VIP: "bg-violet-100 text-violet-700",
  단골: "bg-emerald-100 text-emerald-700",
  신규: "bg-slate-100 text-slate-500",
};

export function CustomerProfileSheet({
  storeId,
  userId,
  onClose,
}: {
  storeId?: string;
  userId: number | null;
  onClose: () => void;
}) {
  const [d, setD] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [memo, setMemo] = useState("");
  const [savingMemo, setSavingMemo] = useState(false);

  useEffect(() => {
    if (!storeId || userId == null) return;
    setLoading(true);
    fetchWithAuth<Detail>(`/api/merchant/stores/${storeId}/customer/${userId}`)
      .then((r) => {
        setD(r);
        setMemo(r.memo || "");
      })
      .catch(() => setD(null))
      .finally(() => setLoading(false));
  }, [storeId, userId]);

  const saveMemo = async () => {
    if (!storeId || userId == null) return;
    setSavingMemo(true);
    try {
      await fetchWithAuth(`/api/merchant/stores/${storeId}/customer/${userId}/memo`, {
        method: "POST",
        body: JSON.stringify({ memo }),
      });
      toast("메모를 저장했어요.", "success");
    } catch {
      toast("저장에 실패했어요.", "error");
    } finally {
      setSavingMemo(false);
    }
  };

  if (userId == null) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative h-full w-full max-w-md overflow-y-auto bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3">
          <div className="text-sm font-semibold text-slate-800">손님 카드</div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>
        ) : !d ? (
          <div className="py-16 text-center text-sm text-slate-400">손님 정보를 불러오지 못했어요.</div>
        ) : (
          <div className="space-y-4 p-5">
            {/* 헤더 */}
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-2xl">{d.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold text-slate-900">{d.persona}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${TIER_STYLE[d.tier] ?? ""}`}>{d.tier}</span>
                  {d.revisit_intent && <span className="text-xs">💛</span>}
                </div>
                <div className="text-[11px] text-slate-400">개인정보 없이 모임 유형·취향으로</div>
              </div>
            </div>

            {/* 취향 */}
            {d.taste.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {d.taste.map((t) => (
                  <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600">#{t}</span>
                ))}
              </div>
            )}

            {/* 접객 브리핑 */}
            {d.brief && (
              <div className="rounded-xl bg-brand-light/40 p-3 text-[13px] text-slate-700">
                💡 {d.brief}
              </div>
            )}

            {/* 지표 */}
            <div className="grid grid-cols-3 gap-2">
              <Stat label="방문" value={`${d.visits}회`} />
              <Stat label="마지막" value={d.last || "—"} />
              <Stat label="요즘 관심" value={d.recent_interest > 0 ? `${d.store_cuisine ?? ""} ${d.recent_interest}곳` : "—"} accent={d.recent_interest > 0} />
            </div>

            {/* 타임라인 */}
            {d.timeline.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-700">방문 타임라인</div>
                <div className="ml-1 border-l-2 border-slate-100 pl-3">
                  {d.timeline.map((t, i) => (
                    <div key={i} className="py-1.5 text-xs">
                      <span className="font-medium text-slate-800">{t.ago}</span>
                      <span className="text-slate-500">
                        {" · "}{t.party}명
                        {t.first && " · 첫 방문"}
                        {t.revisit && " · 재방문의사 ✓"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 후기 */}
            {d.reviews.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-semibold text-slate-700">남긴 후기</div>
                <div className="space-y-2">
                  {d.reviews.map((r, i) => (
                    <div key={i} className="rounded-lg bg-slate-50 p-2.5">
                      <div className="text-[11px] text-amber-500">
                        {"★".repeat(Math.round(r.rating ?? 5))} <span className="text-slate-500">{(r.rating ?? 0).toFixed(1)}</span>
                      </div>
                      {r.comment && <div className="mt-1 text-[13px] text-slate-800">“{r.comment}”</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 사장님 메모 */}
            <div>
              <div className="mb-2 text-xs font-semibold text-slate-700">사장님 메모</div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="예: 기념일에 자주 방문 · 안쪽 룸 선호 · 사이다 서비스 좋아함"
                rows={3}
                maxLength={500}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-[13px] focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
              />
              <div className="mt-1.5 flex justify-end">
                <button
                  onClick={saveMemo}
                  disabled={savingMemo}
                  className="rounded-lg bg-slate-800 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  메모 저장
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2.5 text-center">
      <div className={`text-sm font-bold ${accent ? "text-brand" : "text-slate-900"}`}>{value}</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}
