"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";

const mockReservations = [
  {
    id: "R-101",
    guest: "Alex Kim",
    party: 4,
    time: "18:30",
    date: "2026-02-01",
    status: "confirmed",
    phone: "010-1234-5678",
    notes: "Window seat",
  },
  {
    id: "R-102",
    guest: "Jihyun Lee",
    party: 2,
    time: "19:00",
    date: "2026-02-01",
    status: "pending",
    phone: "010-2222-3333",
    notes: "Anniversary",
  },
  {
    id: "R-103",
    guest: "Daniel Park",
    party: 6,
    time: "20:30",
    date: "2026-02-01",
    status: "canceled",
    phone: "010-4444-5555",
    notes: "",
  },
];

const statusStyles: Record<string, string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  canceled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
};

export function ReservationsPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("table");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return mockReservations;
    return mockReservations.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Reservations</h1>
          <p className="text-sm text-slate-500">Store #{storeId}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">All</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="canceled">Canceled</option>
          </select>
          <Button
            variant={view === "table" ? "primary" : "secondary"}
            onClick={() => setView("table")}
          >
            Table
          </Button>
          <Button
            variant={view === "timeline" ? "primary" : "secondary"}
            onClick={() => setView("timeline")}
          >
            Timeline
          </Button>
        </div>
      </div>

      {view === "table" && (
        <Table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Guest</Th>
              <Th>Party</Th>
              <Th>Date</Th>
              <Th>Time</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <Td>{row.id}</Td>
                <Td>{row.guest}</Td>
                <Td>{row.party}</Td>
                <Td>{row.date}</Td>
                <Td>{row.time}</Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      statusStyles[row.status] ?? "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {row.status}
                  </span>
                </Td>
                <Td>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      router.push(`/stores/${storeId}/reservations/${row.id}`)
                    }
                  >
                    View
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {view === "timeline" && (
        <div className="space-y-3">
          {filtered.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <div className="text-sm font-medium">
                  {row.time} - {row.guest} ({row.party})
                </div>
                <div className="text-xs text-slate-500">{row.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    statusStyles[row.status] ?? "bg-slate-100 text-slate-500"
                  }
                >
                  {row.status}
                </Badge>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/stores/${storeId}/reservations/${row.id}`)
                  }
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}