"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import type { TableUnit } from "@/domain/stores/types";

type ReservationEntry = {
  id: string;
  guestName: string;
  partySize: number;
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show";
  unit_id: string;
  unit_index: number;
  start_time: string;
  end_time: string;
};

const mockUnits: TableUnit[] = [
  {
    id: "unit-hall-4",
    name: "홀 4인석",
    min_capacity: 2,
    max_capacity: 4,
    quantity: 4,
    is_private: false,
  },
  {
    id: "unit-terrace-2",
    name: "테라스 2인석",
    min_capacity: 1,
    max_capacity: 2,
    quantity: 2,
    is_private: false,
  },
  {
    id: "unit-vip",
    name: "VIP 룸",
    min_capacity: 4,
    max_capacity: 8,
    quantity: 2,
    is_private: true,
  },
];

const mockReservations: ReservationEntry[] = [
  {
    id: "R-101",
    guestName: "김민수",
    partySize: 4,
    date: "2026-02-01",
    status: "confirmed",
    unit_id: "unit-hall-4",
    unit_index: 1,
    start_time: "2026-02-01T18:00:00",
    end_time: "2026-02-01T20:00:00",
  },
  {
    id: "R-102",
    guestName: "이지현",
    partySize: 2,
    date: "2026-02-01",
    status: "pending",
    unit_id: "unit-terrace-2",
    unit_index: 2,
    start_time: "2026-02-01T19:00:00",
    end_time: "2026-02-01T21:00:00",
  },
  {
    id: "R-103",
    guestName: "박성준",
    partySize: 6,
    date: "2026-02-01",
    status: "confirmed",
    unit_id: "unit-vip",
    unit_index: 1,
    start_time: "2026-02-01T20:30:00",
    end_time: "2026-02-01T22:30:00",
  },
];

const statusLabelMap: Record<ReservationEntry["status"], string> = {
  confirmed: "확정",
  pending: "대기",
  cancelled: "취소",
  no_show: "노쇼",
};

const statusStyles: Record<ReservationEntry["status"], string> = {
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

const startMinutes = 17 * 60;
const endMinutes = 24 * 60;
const slotMinutes = 30;

function toMinutes(dateString: string) {
  const date = new Date(dateString);
  return date.getHours() * 60 + date.getMinutes();
}

function buildSlots() {
  const slots: string[] = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += slotMinutes) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

function buildRows(units: TableUnit[]) {
  return units.flatMap((unit) =>
    Array.from({ length: unit.quantity }).map((_, index) => ({
      id: `${unit.id}-${index + 1}`,
      unit_id: unit.id,
      unit_index: index + 1,
      label: `${unit.name}-${index + 1}`,
    }))
  );
}

export function ReservationsPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"scheduler" | "list">("scheduler");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return mockReservations;
    return mockReservations.filter((item) => item.status === statusFilter);
  }, [statusFilter]);

  const slots = useMemo(() => buildSlots(), []);
  const rows = useMemo(() => buildRows(mockUnits), []);

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
            variant={view === "scheduler" ? "primary" : "secondary"}
            onClick={() => setView("scheduler")}
          >
            스케줄러 보기
          </Button>
          <Button
            variant={view === "list" ? "primary" : "secondary"}
            onClick={() => setView("list")}
          >
            리스트 보기
          </Button>
        </div>
      </div>

      {view === "scheduler" && (
        <div className="space-y-3">
          <div className="text-sm text-slate-500">
            빈 시간대는 AI가 예약을 추천할 수 있는 슬롯입니다.
          </div>
          <div
            className="grid gap-px rounded-lg border border-slate-200 bg-slate-200 text-xs"
            style={{
              gridTemplateColumns: `160px repeat(${slots.length}, minmax(24px, 1fr))`,
            }}
          >
            <div className="bg-white p-2 font-medium">테이블</div>
            {slots.map((slot) => (
              <div key={slot} className="bg-white p-2 text-center text-slate-500">
                {slot}
              </div>
            ))}
            {rows.map((row) => {
              const rowReservations = filtered.filter(
                (reservation) =>
                  reservation.unit_id === row.unit_id &&
                  reservation.unit_index === row.unit_index
              );

              return (
                <div
                  key={row.id}
                  className="col-span-full grid"
                  style={{
                    gridTemplateColumns: `160px repeat(${slots.length}, minmax(24px, 1fr))`,
                  }}
                >
                  <div className="bg-white p-2 text-slate-700">{row.label}</div>
                  {slots.map((slot, index) => (
                    <div
                      key={`${row.id}-${slot}`}
                      className="bg-white p-2 border-l border-slate-100"
                    />
                  ))}
                  {rowReservations.map((reservation) => {
                    const start = toMinutes(reservation.start_time);
                    const end = toMinutes(reservation.end_time);
                    const startIndex = Math.max(0, Math.floor((start - startMinutes) / slotMinutes));
                    const endIndex = Math.min(
                      slots.length,
                      Math.ceil((end - startMinutes) / slotMinutes)
                    );
                    const columnStart = 2 + startIndex;
                    const columnEnd = Math.max(columnStart + 1, 2 + endIndex);

                    return (
                      <div
                        key={reservation.id}
                        className="z-10 flex items-center justify-between rounded-md bg-slate-900 px-2 py-1 text-xs text-white"
                        style={{
                          gridColumn: `${columnStart} / ${columnEnd}`,
                          gridRow: "1",
                          alignSelf: "center",
                        }}
                      >
                        <span>{reservation.guestName}</span>
                        <span>{reservation.partySize}명</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
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
                <Td>
                  {row.start_time.slice(11, 16)}~{row.end_time.slice(11, 16)}
                </Td>
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
                    상세
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
