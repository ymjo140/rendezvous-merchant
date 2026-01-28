"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

export function ReservationDetailPage({
  reservationId,
}: {
  reservationId?: string;
}) {
  const [status, setStatus] = useState(mockReservation.status);

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
        <Button variant="secondary" onClick={() => setStatus("canceled")}>
          Cancel
        </Button>
        <Button variant="ghost" onClick={() => setStatus("no_show")}>
          No-show
        </Button>
      </div>
    </div>
  );
}