"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, Td, Th } from "@/components/ui/table";
import { Dialog } from "@/components/ui/dialog";
import type { TableUnit } from "@/domain/stores/types";
import { loadTableUnits, saveTableUnits } from "@/lib/utils/tableUnitsStore";
import {
  loadReservations,
  saveReservations,
  type StoredReservation,
} from "@/lib/utils/reservationsStore";

type ReservationEntry = StoredReservation;

type RowInfo = {
  id: string;
  unit_id: string;
  unit_index: number;
  label: string;
};

type CreateForm = {
  id: string;
  guestName: string;
  partySize: string;
  date: string;
  startTime: string;
  endTime: string;
  unit_id: string;
  unit_index: number;
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
    source: "internal",
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
    source: "internal",
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
    source: "internal",
  },
  {
    id: "R-104",
    guestName: "네이버 예약(김철수)",
    partySize: 2,
    date: "2026-02-01",
    status: "confirmed",
    unit_id: "unit-hall-4",
    unit_index: 3,
    start_time: "2026-02-01T18:30:00",
    end_time: "2026-02-01T20:00:00",
    source: "external",
  },
  {
    id: "R-201",
    guestName: "최하늘",
    partySize: 2,
    date: "2026-02-02",
    status: "confirmed",
    unit_id: "unit-terrace-2",
    unit_index: 1,
    start_time: "2026-02-02T17:30:00",
    end_time: "2026-02-02T19:30:00",
    source: "internal",
  },
  {
    id: "R-202",
    guestName: "오지훈",
    partySize: 4,
    date: "2026-02-02",
    status: "cancelled",
    unit_id: "unit-hall-4",
    unit_index: 3,
    start_time: "2026-02-02T18:30:00",
    end_time: "2026-02-02T20:30:00",
    source: "internal",
  },
  {
    id: "R-203",
    guestName: "서지은",
    partySize: 3,
    date: "2026-02-02",
    status: "pending",
    unit_id: "unit-hall-4",
    unit_index: 2,
    start_time: "2026-02-02T19:00:00",
    end_time: "2026-02-02T21:00:00",
    source: "internal",
  },
  {
    id: "R-204",
    guestName: "구글 캘린더(이정아)",
    partySize: 4,
    date: "2026-02-02",
    status: "confirmed",
    unit_id: "unit-vip",
    unit_index: 2,
    start_time: "2026-02-02T20:00:00",
    end_time: "2026-02-02T22:00:00",
    source: "external",
  },
  {
    id: "R-301",
    guestName: "황도윤",
    partySize: 5,
    date: "2026-02-03",
    status: "confirmed",
    unit_id: "unit-vip",
    unit_index: 2,
    start_time: "2026-02-03T18:00:00",
    end_time: "2026-02-03T20:00:00",
    source: "internal",
  },
  {
    id: "R-302",
    guestName: "강유진",
    partySize: 2,
    date: "2026-02-03",
    status: "no_show",
    unit_id: "unit-terrace-2",
    unit_index: 1,
    start_time: "2026-02-03T20:00:00",
    end_time: "2026-02-03T22:00:00",
    source: "internal",
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
const dayLabels = ["일", "월", "화", "수", "목", "금", "토"];

function toMinutes(dateString: string) {
  const date = new Date(dateString);
  return date.getHours() * 60 + date.getMinutes();
}

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateString: string, delta: number) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + delta);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const weekday = dayLabels[date.getDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

export function ReservationsPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState<"scheduler" | "list">("scheduler");
  const [selectedDate, setSelectedDate] = useState(todayString);
  const [tableUnits, setTableUnits] = useState<TableUnit[]>([]);
  const [reservations, setReservations] = useState<ReservationEntry[]>([]);
  const [selectedReservation, setSelectedReservation] =
    useState<ReservationEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm | null>(null);

  useEffect(() => {
    const local = loadReservations(storeId);
    if (local) {
      setReservations(local);
    } else {
      setReservations(mockReservations);
      saveReservations(storeId, mockReservations);
    }
  }, [storeId]);

  useEffect(() => {
    const localUnits = loadTableUnits(storeId);
    if (localUnits && localUnits.length > 0) {
      setTableUnits(localUnits);
    } else {
      setTableUnits(mockUnits);
      saveTableUnits(storeId, mockUnits);
    }
  }, [storeId]);

  const filtered = useMemo(() => {
    return reservations.filter((item) => {
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      const dateMatch = item.date === selectedDate;
      return statusMatch && dateMatch;
    });
  }, [reservations, statusFilter, selectedDate]);

  const slots = useMemo(() => buildSlots(), []);
  const rows = useMemo(() => buildRows(tableUnits), [tableUnits]);
  const dateLabel = formatDateLabel(selectedDate);

  function openDetail(item: ReservationEntry) {
    if (item.source === "external") {
      window.alert("외부 플랫폼에서 관리되는 예약입니다.");
      return;
    }
    setSelectedReservation(item);
    setDialogOpen(true);
  }

  function updateReservationStatus(
    reservationId: string,
    nextStatus: ReservationEntry["status"]
  ) {
    setReservations((prev) => {
      let next: ReservationEntry[];
      if (nextStatus === "cancelled") {
        next = prev.filter((item) => item.id !== reservationId);
      } else {
        next = prev.map((item) =>
          item.id === reservationId ? { ...item, status: nextStatus } : item
        );
      }
      saveReservations(storeId, next);
      return next;
    });
    setDialogOpen(false);
  }

  function openCreate(row: RowInfo, slot: string) {
    const startTime = slot;
    const endTime = minutesToTime(timeToMinutes(slot) + 120);
    setCreateForm({
      id: "",
      guestName: "",
      partySize: "2",
      date: selectedDate,
      startTime,
      endTime,
      unit_id: row.unit_id,
      unit_index: row.unit_index,
    });
    setCreateOpen(true);
  }

  function handleCreateSubmit() {
    if (!createForm) return;
    const { id, guestName, partySize, date, startTime, endTime } = createForm;

    if (!id.trim() || !guestName.trim()) {
      window.alert("예약 번호와 고객 이름을 입력해 주세요.");
      return;
    }

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    if (end <= start) {
      window.alert("종료 시간이 시작 시간보다 늦어야 합니다.");
      return;
    }

    const overlap = reservations.some((item) => {
      if (item.date !== date) return false;
      if (item.unit_id !== createForm.unit_id) return false;
      if (item.unit_index !== createForm.unit_index) return false;
      if (item.status === "cancelled" || item.status === "no_show") return false;
      const itemStart = timeToMinutes(item.start_time.slice(11, 16));
      const itemEnd = timeToMinutes(item.end_time.slice(11, 16));
      return start < itemEnd && end > itemStart;
    });

    if (overlap) {
      window.alert("해당 시간대에 이미 예약이 있습니다.");
      return;
    }

    const newReservation: ReservationEntry = {
      id: id.trim(),
      guestName: guestName.trim(),
      partySize: Number(partySize) || 1,
      date,
      status: "confirmed",
      unit_id: createForm.unit_id,
      unit_index: createForm.unit_index,
      start_time: `${date}T${startTime}:00`,
      end_time: `${date}T${endTime}:00`,
      source: "internal",
    };

    setReservations((prev) => {
      const next = [newReservation, ...prev];
      saveReservations(storeId, next);
      return next;
    });

    setCreateOpen(false);
  }

  const schedulerItems = filtered.filter(
    (item) => item.status !== "cancelled" && item.status !== "no_show"
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">예약 목록</h1>
          <p className="text-sm text-slate-500">매장 #{storeId}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm">
            <Button
              variant="ghost"
              onClick={() => setSelectedDate((prev) => addDays(prev, -1))}
            >
              {"<"}
            </Button>
            <div className="relative px-2 text-sm font-medium">
              {dateLabel}
              <input
                type="date"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => setSelectedDate((prev) => addDays(prev, 1))}
            >
              {">"}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="border border-slate-300 text-slate-700"
            onClick={() =>
              window.alert("구글/네이버 캘린더와 연동하여 중복 예약을 방지합니다.")
            }
          >
            📅 외부 캘린더 연동
          </Button>
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

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-center space-y-3">
          <div className="text-lg font-semibold">
            📅 {dateLabel}에는 아직 예약이 없습니다.
          </div>
          <p className="text-sm text-slate-500">
            지금 이 시간대에 타임세일을 걸어 손님을 모아보세요!
          </p>
          <Button onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
            새 룰 만들기
          </Button>
        </div>
      ) : null}

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
              const rowReservations = schedulerItems.filter(
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
                  {slots.map((slot) => {
                    const slotMinutesValue = timeToMinutes(slot);
                    const occupied = rowReservations.some((reservation) => {
                      const start = timeToMinutes(reservation.start_time.slice(11, 16));
                      const end = timeToMinutes(reservation.end_time.slice(11, 16));
                      return slotMinutesValue >= start && slotMinutesValue < end;
                    });

                    return (
                      <button
                        key={`${row.id}-${slot}`}
                        type="button"
                        className={`bg-white p-2 border-l border-slate-100 ${
                          occupied ? "cursor-not-allowed" : "hover:bg-slate-50"
                        }`}
                        onClick={() => {
                          if (occupied) return;
                          openCreate(row, slot);
                        }}
                      />
                    );
                  })}
                  {rowReservations.map((reservation) => {
                    const start = toMinutes(reservation.start_time);
                    const end = toMinutes(reservation.end_time);
                    const startIndex = Math.max(
                      0,
                      Math.floor((start - startMinutes) / slotMinutes)
                    );
                    const endIndex = Math.min(
                      slots.length,
                      Math.ceil((end - startMinutes) / slotMinutes)
                    );
                    const columnStart = 2 + startIndex;
                    const columnEnd = Math.max(columnStart + 1, 2 + endIndex);
                    const isExternal = reservation.source === "external";

                    return (
                      <div
                        key={reservation.id}
                        className={`z-10 flex items-center justify-between rounded-md px-2 py-1 text-xs ${
                          isExternal
                            ? "bg-slate-200 text-slate-700"
                            : reservation.status === "no_show"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-900 text-white"
                        } ${isExternal ? "cursor-pointer" : ""}`}
                        style={{
                          gridColumn: `${columnStart} / ${columnEnd}`,
                          gridRow: "1",
                          alignSelf: "center",
                          backgroundImage: isExternal
                            ? "repeating-linear-gradient(45deg, rgba(148,163,184,0.35), rgba(148,163,184,0.35) 6px, rgba(255,255,255,0.4) 6px, rgba(255,255,255,0.4) 12px)"
                            : undefined,
                        }}
                        onClick={() => {
                          if (isExternal) {
                            window.alert("외부 플랫폼에서 관리되는 예약입니다.");
                          } else {
                            openDetail(reservation);
                          }
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
            {filtered.length === 0 ? (
              <tr>
                <Td colSpan={7}>
                  <div className="py-6 text-center text-sm text-slate-500">
                    선택한 날짜에 예약이 없습니다.
                  </div>
                </Td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id}>
                  <Td>{row.id}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span>{row.guestName}</span>
                      {row.source === "external" ? (
                        <Badge className="bg-slate-200 text-slate-600">외부</Badge>
                      ) : null}
                    </div>
                  </Td>
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
                    <Button variant="ghost" onClick={() => openDetail(row)}>
                      상세
                    </Button>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}

      <Dialog open={dialogOpen}>
        {selectedReservation ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">예약 상세</div>
              <Badge className={statusStyles[selectedReservation.status]}>
                {statusLabelMap[selectedReservation.status]}
              </Badge>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div>예약 번호: {selectedReservation.id}</div>
              <div>고객: {selectedReservation.guestName}</div>
              <div>인원: {selectedReservation.partySize}명</div>
              <div>
                시간: {selectedReservation.start_time.slice(11, 16)}~
                {selectedReservation.end_time.slice(11, 16)}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  updateReservationStatus(selectedReservation.id, "confirmed")
                }
              >
                확정
              </Button>
              <Button
                variant="secondary"
                className="bg-rose-50 text-rose-600 hover:bg-rose-100"
                onClick={() =>
                  updateReservationStatus(selectedReservation.id, "no_show")
                }
              >
                노쇼
              </Button>
              <Button
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() =>
                  updateReservationStatus(selectedReservation.id, "cancelled")
                }
              >
                취소
              </Button>
            </div>
          </div>
        ) : null}
      </Dialog>

      <Dialog open={createOpen}>
        {createForm ? (
          <div className="space-y-4">
            <div className="text-lg font-semibold">새 예약 추가</div>
            <div className="grid gap-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">예약 번호</label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                  value={createForm.id}
                  onChange={(event) =>
                    setCreateForm({ ...createForm, id: event.target.value })
                  }
                  placeholder="R-101"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">고객</label>
                <input
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                  value={createForm.guestName}
                  onChange={(event) =>
                    setCreateForm({
                      ...createForm,
                      guestName: event.target.value,
                    })
                  }
                  placeholder="김민수"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">인원</label>
                  <input
                    type="number"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.partySize}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        partySize: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">날짜</label>
                  <input
                    type="date"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.date}
                    onChange={(event) =>
                      setCreateForm({ ...createForm, date: event.target.value })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">시작 시간</label>
                  <input
                    type="time"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.startTime}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        startTime: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">종료 시간</label>
                  <input
                    type="time"
                    className="h-10 w-full rounded-md border border-slate-200 px-3"
                    value={createForm.endTime}
                    onChange={(event) =>
                      setCreateForm({
                        ...createForm,
                        endTime: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="text-xs text-slate-500">
                테이블: {createForm.unit_id}-{createForm.unit_index}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                취소
              </Button>
              <Button onClick={handleCreateSubmit}>추가</Button>
            </div>
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}
