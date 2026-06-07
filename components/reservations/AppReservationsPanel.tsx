"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppReservations, type AppReservationRow } from "@/lib/hooks/useAppReservations";

const STATUS_LABEL: Record<AppReservationRow["status"], string> = {
  confirmed: "예약 대기",
  completed: "방문 완료",
  cancelled: "취소됨",
  no_show: "노쇼",
};

const STATUS_STYLE: Record<AppReservationRow["status"], string> = {
  confirmed: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
};

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AppReservationsPanel({ storeId }: { storeId?: string }) {
  const { data: reservations = [], setStatus, isSupabaseConfigured } = useAppReservations(storeId);
  const [pendingId, setPendingId] = useState<string | null>(null);

  // 오늘 이후 예약만(과거 취소건 등 숨김), 활성(취소/노쇼 제외) 우선
  const visible = useMemo(() => {
    const today = todayStr();
    return reservations
      .filter((r) => r.date >= today)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [reservations]);

  const activeCount = visible.filter((r) => r.status === "confirmed").length;

  const change = async (id: string, status: AppReservationRow["status"]) => {
    setPendingId(id);
    try {
      await setStatus.mutateAsync({ id, status });
    } catch {
      window.alert("상태 변경에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setPendingId(null);
    }
  };

  if (!isSupabaseConfigured) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">📱</span>
          <h2 className="text-sm font-bold text-slate-900">앱 예약</h2>
          {activeCount > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">
              대기 {activeCount}
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400">랑데부 앱에서 들어온 예약</span>
      </div>

      {visible.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-400">아직 앱 예약이 없어요.</div>
      ) : (
        <div className="space-y-2">
          {visible.map((r) => {
            const busy = pendingId === r.id;
            return (
              <div
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {r.date === todayStr() ? "오늘" : r.date} {r.time}
                    </span>
                    <Badge className={STATUS_STYLE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {r.party_size}명
                    {r.deposit_amount > 0 && ` · 예약금 ${r.deposit_amount.toLocaleString()}원`}
                  </div>
                </div>

                {r.status === "confirmed" && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      disabled={busy}
                      onClick={() => change(r.id, "completed")}
                      className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-xs"
                    >
                      방문완료
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={busy}
                      onClick={() => {
                        if (window.confirm("예약을 취소할까요? 손님에게 예약금이 환불됩니다.")) {
                          change(r.id, "cancelled");
                        }
                      }}
                      className="h-8 px-3 text-rose-500 hover:bg-rose-50 text-xs"
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
