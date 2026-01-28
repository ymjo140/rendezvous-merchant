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
    guestName: "김민수",
    partySize: 4,
    time: "18:30",
    date: "2026-02-01",
    status: "confirmed",
    phone: "010-1234-5678",
    notes: "창가 좌석",
  },
  {
    id: "R-102",
    guestName: "이지현",
    partySize: 2,
    time: "19:00",
    date: "2026-02-01",
    status: "pending",
    phone: "010-2222-3333",
    notes: "기념일",
  },
  {
    id: "R-103",
    guestName: "박성준",
    partySize: 6,
    time: "20:30",
    date: "2026-02-01",
    status: "cancelled",
    phone: "010-4444-5555",
    notes: "",
  },
];

const statusLabelMap: Record<Reservation["status"], string> = {
  confirmed: "확정",
  pending: "대기",
  cancelled: "취소",
  no_show: "노쇼",
};

const statusStyles: Record<Reservation["status"], string> = {
  confirmed: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  cancelled: "bg-slate-100 text-slate-500",
  no_show: "bg-rose-100 text-rose-700",
};

const statusOptions = [
  { value: "all", label: "전체" },
  { value: "confirmed", label: "확정" },
  { value: "pending", label: "대기" },
  { value: "cancelled", label: "취소" },
  { value: "no_show", label: "노쇼" },
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
          <h1 className="text-2xl font-semibold">예약 목록</h1>
          <p className="text-sm text-slate-500">매장 #{storeId}</p>
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
            표
          </Button>
          <Button
            variant={view === "timeline" ? "primary" : "secondary"}
            onClick={() => setView("timeline")}
          >
            타임라인
          </Button>
        </div>
      </div>

      {view === "table" && (
        <Table>
          <thead>
            <tr>
              <Th>예약 번호</Th>
              <Th>고객</Th>
              <Th>인원</Th>
              <Th>날짜</Th>
              <Th>시간</Th>
              <Th>상태</Th>
              <Th>조치</Th>
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
                    className={`rounded-full px-2 py-1 text-xs ${
                      statusStyles[row.status]
                    }`}
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
                    상세
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
                  {row.time} - {row.guestName} ({row.partySize})
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
                  열기
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

