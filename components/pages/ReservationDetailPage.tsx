"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";

const mockReservation = {
  id: "R-101",
  guest: "Alex Kim",
  party: 4,
  date: "2026-02-01",
  time: "18:30",
  status: "pending",
  phone: "010-1234-5678",
  notes: "Window seat",
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
  const [status, setStatus] = useState(mockReservation.status);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"cancel" | "no_show" | null>(null);
  const [reason, setReason] = useState(cancelReasons[0]);

  function openReason(action: "cancel" | "no_show") {
    setPendingAction(action);
    setDialogOpen(true);
  }

  function confirmReason() {
    if (pendingAction === "cancel") {
      setStatus("canceled");
    }
    if (pendingAction === "no_show") {
      setStatus("no_show");
    }
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reservation Detail</h1>
          <p className="text-sm text-slate-500">ID: {reservationId}</p>
        </div>
        <Badge className="bg-amber-100 text-amber-700">{status}</Badge>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <div className="text-sm text-slate-600">Guest: {mockReservation.guest}</div>
        <div className="text-sm text-slate-600">Party: {mockReservation.party}</div>
        <div className="text-sm text-slate-600">
          Date/Time: {mockReservation.date} {mockReservation.time}
        </div>
        <div className="text-sm text-slate-600">Phone: {mockReservation.phone}</div>
        <div className="text-sm text-slate-600">Notes: {mockReservation.notes || "-"}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setStatus("confirmed")}>Confirm</Button>
        <Button variant="secondary" onClick={() => openReason("cancel")}>
          Cancel
        </Button>
        <Button variant="ghost" onClick={() => openReason("no_show")}>
          No-show
        </Button>
      </div>

      <Dialog open={dialogOpen}>
        <div className="space-y-4">
          <div className="text-lg font-semibold">Select reason</div>
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
              Close
            </Button>
            <Button onClick={confirmReason}>Confirm</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
