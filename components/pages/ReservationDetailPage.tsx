"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "no_show";

const mockReservation = {
  id: "R-101",
  guestName: "\uAE40\uBBFC\uC218",
  partySize: 4,
  date: "2026-02-01",
  time: "18:30",
  status: "pending" as ReservationStatus,
  phone: "010-1234-5678",
  notes: "\uCC3D\uAC00 \uC88C\uC11D",
};

const statusLabels: Record<ReservationStatus, string> = {
  pending: "\uB300\uAE30",
  confirmed: "\uD655\uC815",
  cancelled: "\uCDE8\uC18C",
  no_show: "\uB178\uC1FC",
};

const statusStyles: Record<ReservationStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
};

const cancelReasons = [
  "\uACE0\uAC1D \uC5F0\uB77D \uB450\uC808",
  "\uC7AC\uB8CC \uC18C\uC9C4\uC73C\uB85C \uC778\uD55C \uCDE8\uC18C",
  "\uB2E8\uC21C \uBCC0\uC2EC",
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
          <h1 className="text-2xl font-semibold">\uC608\uC57D \uC0C1\uC138</h1>
          <p className="text-sm text-slate-500">\uC608\uC57D \uBC88\uD638: {reservationId}</p>
        </div>
        <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <div className="text-sm text-slate-600">
          \uACE0\uAC1D: {mockReservation.guestName}
        </div>
        <div className="text-sm text-slate-600">
          \uC778\uC6D0: {mockReservation.partySize}
        </div>
        <div className="text-sm text-slate-600">
          \uB0A0\uC9DC/\uC2DC\uAC04: {mockReservation.date} {mockReservation.time}
        </div>
        <div className="text-sm text-slate-600">
          \uC5F0\uB77D\uCC98: {mockReservation.phone}
        </div>
        <div className="text-sm text-slate-600">
          \uC694\uCCAD \uC0AC\uD56D: {mockReservation.notes || "-"}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setStatus("confirmed")}>
          \uD655\uC815
        </Button>
        <Button variant="secondary" onClick={() => openReason("cancelled")}>
          \uCDE8\uC18C
        </Button>
        <Button variant="ghost" onClick={() => openReason("no_show")}>
          \uB178\uC1FC
        </Button>
      </div>

      <Dialog open={dialogOpen}>
        <div className="space-y-4">
          <div className="text-lg font-semibold">\uC0AC\uC720 \uC120\uD0DD</div>
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
              \uB2EB\uAE30
            </Button>
            <Button onClick={confirmReason}>\uD655\uC815</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

