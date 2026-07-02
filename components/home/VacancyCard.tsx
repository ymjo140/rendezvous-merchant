"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";

// 🔴 지금 빈자리 알림 — 사장님 원탭 신호.
// 누르면 places.vacancy_until = now + 선택시간 → 손님 앱 추천에 '지금 입장 가능' 노출.
// 시간이 지나면 자동으로 꺼짐(TTL) → 오래된 정보가 남지 않음.

const DURATIONS = [
  { label: "30분", min: 30 },
  { label: "1시간", min: 60 },
  { label: "90분", min: 90 },
  { label: "2시간", min: 120 },
];

export function VacancyCard({ storeId }: { storeId?: string }) {
  const placeId = Number(storeId);
  const [until, setUntil] = useState<Date | null>(null);
  const [remainText, setRemainText] = useState("");
  const [saving, setSaving] = useState(false);
  const [duration, setDuration] = useState(90);

  // 현재 상태 로드
  useEffect(() => {
    if (!Number.isFinite(placeId)) return;
    let active = true;
    supabase
      .from("places")
      .select("vacancy_until")
      .eq("id", placeId)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const v = data?.vacancy_until ? new Date(data.vacancy_until) : null;
        setUntil(v && v.getTime() > Date.now() ? v : null);
      });
    return () => {
      active = false;
    };
  }, [placeId]);

  // 남은 시간 표시 + 만료 시 자동 꺼짐
  useEffect(() => {
    if (!until) {
      setRemainText("");
      return;
    }
    const tick = () => {
      const ms = until.getTime() - Date.now();
      if (ms <= 0) {
        setUntil(null);
        return;
      }
      const m = Math.ceil(ms / 60000);
      setRemainText(m >= 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${m}분`);
    };
    tick();
    const t = setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [until]);

  const turnOn = async () => {
    if (!Number.isFinite(placeId)) return;
    setSaving(true);
    const v = new Date(Date.now() + duration * 60_000);
    const { error } = await supabase
      .from("places")
      .update({ vacancy_until: v.toISOString() })
      .eq("id", placeId);
    setSaving(false);
    if (error) {
      toast("설정에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
      return;
    }
    setUntil(v);
    toast(`빈자리 알림 켜짐! ${duration}분 동안 손님 앱에 노출됩니다.`, "success");
  };

  const turnOff = async () => {
    if (!Number.isFinite(placeId)) return;
    setSaving(true);
    const { error } = await supabase
      .from("places")
      .update({ vacancy_until: null })
      .eq("id", placeId);
    setSaving(false);
    if (error) {
      toast("해제에 실패했어요.", "error");
      return;
    }
    setUntil(null);
    toast("빈자리 알림을 껐어요.", "success");
  };

  const isOn = Boolean(until);

  return (
    <Card className={isOn ? "border-rose-300 bg-rose-50/60" : "border-slate-200"}>
      <CardContent className="p-4">
        {isOn ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500" />
              </span>
              <div>
                <div className="text-sm font-bold text-rose-700">지금 빈자리 알림 켜짐</div>
                <div className="text-xs text-rose-500">손님 앱에 노출 중 · {remainText} 후 자동 꺼짐</div>
              </div>
            </div>
            <button
              onClick={turnOff}
              disabled={saving}
              className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50"
            >
              끄기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-800">🪑 지금 매장에 빈자리가 있나요?</div>
                <div className="text-xs text-slate-500">
                  버튼 한 번이면 근처에서 모임 장소 찾는 손님에게 &lsquo;지금 입장 가능&rsquo;으로 노출돼요.
                </div>
              </div>
              <a
                href={`/stores/${storeId}/tables`}
                className="flex-shrink-0 text-xs font-bold text-brand hover:underline"
              >
                테이블별 관리 →
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {DURATIONS.map((d) => (
                  <button
                    key={d.min}
                    onClick={() => setDuration(d.min)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                      duration === d.min
                        ? "bg-slate-800 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <button
                onClick={turnOn}
                disabled={saving}
                className="ml-auto rounded-xl bg-rose-500 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-rose-600 disabled:opacity-50"
              >
                {saving ? "저장 중..." : "🔴 빈자리 알리기"}
              </button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
