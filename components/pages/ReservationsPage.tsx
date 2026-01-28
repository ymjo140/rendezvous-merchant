"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";

type Reservation = {
  id: string;
  guestName: string;
  partySize: number;
  time: string;
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show";
  phone: string;
  notes: string;
};

const mockReservations: Reservation[] = [
  {
    id: "R-101",
    guestName: "\uAE40\uBBFC\uC218",
    partySize: 4,
    time: "18:30",
    date: "2026-02-01",
    status: "confirmed",
    phone: "010-1234-5678",
    notes: "\uCC3D\uAC00 \uC88C\uC11D",
  },
  {
    id: "R-102",
    guestName: "\uC774\uC9C0\uD604",
    partySize: 2,
    time: "19:00",
    date: "2026-02-01",
    status: "pending",
    phone: "010-2222-3333",
    notes: "\uAE30\uB150\uC77C",
  },
  {
    id: "R-103",
    guestName: "\uBC15\uC131\uC900",
    partySize: 6,
    time: "20:30",
    date: "2026-02-01",
    status: "cancelled",
    phone: "010-4444-5555",
    notes: "",
  },
];

const statusLabelMap: Record<Reservation["status"], string> = {
  confirmed: "\uD655\uC815",
  pending: "\uB300\uAE30",
  cancelled: "\uCDE8\uC18C",
  no_show: "\uB178\uC1FC",
};

const statusStyles: Record<Reservation["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
};

const statusOptions = [
  { value: "all", label: "\uC804\uCCB4" },
  { value: "confirmed", label: "\uD655\uC815" },
  { value: "pending", label: "\uB300\uAE30" },
  { value: "cancelled", label: "\uCDE8\uC18C" },
  { value: "no_show", label: "\uB178\uC1FC" },
];

export function ReservationsPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"table" | "timeline">("table");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return mockReservations;
    return mockReservations.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{"\uC608\uC57D \uBAA9\uB85D"}</h1>
          <p className="text-sm text-slate-500">{"\uB9E4\uC7A5 #"}{storeId}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant={view === "table" ? "primary" : "secondary"}
            onClick={() => setView("table")}
          >
            {"\uD45C"}
          </Button>
          <Button
            variant={view === "timeline" ? "primary" : "secondary"}
            onClick={() => setView("timeline")}
          >
            {"\uD0C0\uC784\uB77C\uC778"}
          </Button>
        </div>
      </div>

      {view === "table" && (
        <Table>
          <thead>
            <tr>
              <Th>{"\uC608\uC57D \uBC88\uD638"}</Th>
              <Th>{"\uACE0\uAC1D"}</Th>
              <Th>{"\uC778\uC6D0"}</Th>
              <Th>{"\uB0A0\uC9DC"}</Th>
              <Th>{"\uC2DC\uAC04"}</Th>
              <Th>{"\uC0C1\uD0DC"}</Th>
              <Th>{"\uC870\uCE58"}</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <Td>{row.id}</Td>
                <Td>{row.guestName}</Td>
                <Td>{row.partySize}</Td>
                <Td>{row.date}</Td>
                <Td>{row.time}</Td>
                <Td>
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${statusStyles[row.status]}`}
                  >
                    {statusLabelMap[row.status]}
                  </span>
                </Td>
                <Td>
                  <Button
                    variant="ghost"
                    onClick={() =>
                      router.push(`/stores/${storeId}/reservations/${row.id}`)
                    }
                  >
                    {"\uC0C1\uC138"}
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
                  {row.time}{" - "}{row.guestName}{" ("}{row.partySize}{")"}
                </div>
                <div className="text-xs text-slate-500">{row.date}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusStyles[row.status]}>
                  {statusLabelMap[row.status]}
                </Badge>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/stores/${storeId}/reservations/${row.id}`)
                  }
                >
                  {"\uC5F4\uAE30"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}