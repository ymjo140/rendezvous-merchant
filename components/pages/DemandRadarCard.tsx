"use client";

// 📡 지금 찾는 중인 크루 — 기존 CRM이 못 보는 자리.
// POS도 도도포인트도 '왔던 사람'만 안다. 이 카드는 아직 안 온 크루가 손님 앱에서
// 장소를 고르고 있는 순간을 보여준다. 사장님이 할 일은 제안 수락이 아니라 '먼저 제안'.
//
// 신원은 안 온다 — 몇 명이·무슨 목적으로·언제쯤·얼마나 가까이까지다.
// 크루 이름과 멤버는 그쪽이 제안을 수락한 뒤에야 열린다.

import { useCallback, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api/client";

type Signal = {
  signal_id: number;
  party_size: number;
  purpose: string;
  when_date: string | null;
  when_time: string | null;
  area: string;
  regions: string[];        // 크루가 나란히 놓고 검토 중인 동네들
  distance_km: number;
  candidates: number;
  candidates_here: number;  // 그중 우리 동네에서 담긴 후보 수
  on_candidate_list: boolean;
  opened_hours_ago: number;
};

type DemandResponse = {
  items: Signal[];
  count: number;
  radius_km: number;
  fresh_hours: number;
  store_name?: string;
  note?: string;
};

const PURPOSE_EMOJI: Record<string, string> = {
  "식사": "🍚", "카페": "☕", "술/회식": "🍺", "데이트": "💖",
};

function whenLabel(s: Signal) {
  if (!s.when_date) return "날짜 정하는 중";
  const d = new Date(`${s.when_date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return s.when_date;
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}/${d.getDate()}(${dow})${s.when_time ? ` ${s.when_time}` : ""}`;
}

function agoLabel(h: number) {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}분 전`;
  if (h < 24) return `${Math.round(h)}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

export function DemandRadarCard({ storeId }: { storeId?: string }) {
  const [data, setData] = useState<DemandResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<number | null>(null);
  const [sent, setSent] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    fetchWithAuth<DemandResponse>(`/api/merchant/stores/${storeId}/demand?radius_km=3`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const offer = async (s: Signal) => {
    if (!storeId) return;
    setSending(s.signal_id);
    setError(null);
    try {
      const r = await fetchWithAuth<{ sent: number; already?: boolean; benefit?: string }>(
        `/api/merchant/stores/${storeId}/demand/${s.signal_id}/offer`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setSent((prev) => ({
        ...prev,
        [s.signal_id]: r.already ? "이미 보낸 크루예요" : `제안 보냄 · ${r.benefit ?? "혜택"}`,
      }));
    } catch (e: unknown) {
      // 딜이 하나도 없으면 제안할 게 없다 — 그 말을 그대로 해준다
      const detail = (e as { details?: { detail?: { code?: string } | string } })?.details?.detail;
      const code = typeof detail === "object" ? detail?.code : undefined;
      setError(code === "no_deal"
        ? "먼저 제휴 혜택을 하나 만들어 주세요. (핫딜 → 혜택)"
        : "제안을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSending(null);
    }
  };

  if (!storeId) return null;

  return (
    <div className="mt-3 rounded-2xl border border-[#F0E6D2] bg-white p-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="text-[12px] font-semibold text-slate-700">📡 지금 찾는 중인 크루</div>
          <div className="mt-0.5 text-[10.5px] text-[#B49A6A]">
            손님 앱에서 갈 곳을 고르고 있는 모임이에요. 아직 안 온 손님입니다.
          </div>
        </div>
        <button
          onClick={load}
          className="shrink-0 rounded-lg border border-[#F0E6D2] px-2 py-1 text-[10.5px] text-slate-500 hover:border-[#F5A623]"
        >
          새로고침
        </button>
      </div>

      {loading && <div className="py-6 text-center text-[12px] text-slate-300">불러오는 중…</div>}

      {!loading && (!data || data.items.length === 0) && (
        <div className="py-6 text-center text-[12px] text-slate-400">
          {data?.note ?? "지금은 근처에서 장소를 고르는 모임이 없어요."}
          <div className="mt-1 text-[10.5px] text-slate-300">
            반경 {data?.radius_km ?? 3}km · 최근 {data?.fresh_hours ?? 72}시간 이내
          </div>
        </div>
      )}

      {!loading && data && data.items.length > 0 && (
        <div className="mt-3 space-y-2">
          {data.items.slice(0, 5).map((s) => (
            <div key={s.signal_id} className="rounded-xl border border-[#F5EBD8] bg-[#FFFDF8] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-slate-800">
                    {PURPOSE_EMOJI[s.purpose] ?? "📍"} {s.party_size}명 · {s.purpose}
                    {s.on_candidate_list && (
                      <span className="ml-1.5 rounded bg-[#F5A623] px-1.5 py-0.5 text-[9.5px] font-bold text-white">
                        우리 가게 후보에 있음
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
                    {whenLabel(s)} · {s.area || "근처"} {s.distance_km}km · 후보 {s.candidates}곳
                  </div>
                  {/* 크루는 동네 여러 곳을 놓고 고른다 — 우리 동네가 아직 비었으면 그게 기회다 */}
                  {s.regions.length > 1 && (
                    <div className="mt-0.5 text-[10.5px] text-slate-500">
                      검토 중인 동네: {s.regions.join(" · ")}
                      {s.candidates_here === 0 ? (
                        <span className="ml-1 font-semibold text-[#B4551F]">우리 동네는 아직 후보 0곳</span>
                      ) : (
                        <span className="ml-1 text-slate-400">우리 동네 후보 {s.candidates_here}곳</span>
                      )}
                    </div>
                  )}
                  <div className="mt-0.5 text-[10px] text-slate-400">{agoLabel(s.opened_hours_ago)}에 고르기 시작</div>
                </div>
                {sent[s.signal_id] ? (
                  <span className="shrink-0 text-[11px] font-semibold text-teal-600">{sent[s.signal_id]}</span>
                ) : (
                  <button
                    onClick={() => offer(s)}
                    disabled={sending === s.signal_id}
                    className="shrink-0 rounded-xl bg-[#F5A623] px-3 py-2 text-[11.5px] font-bold text-white disabled:opacity-50"
                  >
                    {sending === s.signal_id ? "보내는 중…" : "혜택 제안"}
                  </button>
                )}
              </div>
            </div>
          ))}
          {error && <div className="text-[11px] text-rose-500">{error}</div>}
          <div className="text-[10px] text-slate-400">
            모임 이름과 멤버는 보이지 않아요. 크루가 제안을 수락하면 그때 연결됩니다.
          </div>
        </div>
      )}
    </div>
  );
}
