"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "no_show";

const mockReservation = {
  id: "R-101",
  guestName: "김민수",
  partySize: 4,
  date: "2026-02-01",
  time: "18:30",
  status: "pending" as ReservationStatus,
  phone: "010-1234-5678",
  notes: "창가 좌석",
};

const statusLabels: Record<ReservationStatus, string> = {
  pending: "대기",
  confirmed: "확정",
  cancelled: "취소",
  no_show: "노쇼",
};

const statusStyles: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
};

const cancelReasons = [
  "고객 연락 두절",
  "재료 소진으로 인한 취소",
  "단순 변심",
];

export function ReservationDetailPage({
  reservationId,
}: {
  reservationId?: string;
}) {
  const [status, setStatus] = useState<ReservationStatus>(mockReservation.status);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"cancelled" | "no_show" | null>(
    null
  );
  const [reason, setReason] = useState(cancelReasons[0]);

  function openReason(action: "cancelled" | "no_show") {
    setPendingAction(action);
    setDialogOpen(true);
  }

  function confirmReason() {
    if (pendingAction) {
      setStatus(pendingAction);
    }
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">예약 상세</h1>
          <p className="text-sm text-slate-500">예약 번호: {reservationId}</p>
        </div>
        <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <div className="text-sm text-slate-600">
          고객: {mockReservation.guestName}
        </div>
        <div className="text-sm text-slate-600">
          인원: {mockReservation.partySize}
        </div>
        <div className="text-sm text-slate-600">
          날짜/시간: {mockReservation.date} {mockReservation.time}
        </div>
        <div className="text-sm text-slate-600">
          연락처: {mockReservation.phone}
        </div>
        <div className="text-sm text-slate-600">
          요청 사항: {mockReservation.notes || "-"}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setStatus("confirmed")}>
          확정
        </Button>
        <Button variant="secondary" onClick={() => openReason("cancelled")}>
          취소
        </Button>
        <Button variant="ghost" onClick={() => openReason("no_show")}>
          노쇼
        </Button>
      </div>

      <Dialog open={dialogOpen}>
        <div className="space-y-4">
          <div className="text-lg font-semibold">사유 선택</div>
          <div className="space-y-2 text-sm">
            {cancelReasons.map((item) => (
              <label key={item} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === item}
                  onChange={() => setReason(item)}
                />
                {item}
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              닫기
            </Button>
            <Button onClick={confirmReason}>확정</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

