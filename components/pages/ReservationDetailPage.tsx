"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useStoreId } from "@/components/layout/Layout";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useReservations } from "@/lib/hooks/useReservations";
import { autoAssign } from "@/lib/hooks/useAutoAssign";

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "no_show";

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
  const contextStoreId = useStoreId();
  const storeId = contextStoreId ?? undefined;
  const { data: unitRows = [] } = useTableUnits(storeId);
  const {
    data: reservationRows = [],
    updateReservation,
  } = useReservations(storeId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<"cancelled" | "no_show" | null>(
    null
  );
  const [reason, setReason] = useState(cancelReasons[0]);

  const tableOptions = useMemo(() => {
    return unitRows.flatMap((unit) =>
      Array.from({ length: unit.quantity }).map((_, index) => ({
        unit_id: unit.id,
        unit_index: index + 1,
        label: `${unit.name}-${index + 1}`,
        value: `${unit.id}:${index + 1}`,
      }))
    );
  }, [unitRows]);

  const reservation = reservationId
    ? reservationRows.find((row) => String(row.id) === String(reservationId))
    : undefined;

  const currentTableValue = reservation
    ? `${reservation.unit_id}:${reservation.unit_index}`
    : "";

  const [selectedTableValue, setSelectedTableValue] = useState(currentTableValue);

  useEffect(() => {
    if (currentTableValue) {
      setSelectedTableValue(currentTableValue);
    }
  }, [currentTableValue]);

  const suggestedAssignment = useMemo(() => {
    if (!reservation) return null;
    const existing = reservationRows
      .filter((row) => String(row.id) !== String(reservation.id))
      .map((row) => ({
        date: row.date,
        status: row.status,
        unit_id: row.unit_id,
        unit_index: row.unit_index,
        start_time: row.start_time,
        end_time: row.end_time,
      }));
    return autoAssign(
      {
        partySize: reservation.party_size,
        date: reservation.date,
        startTime: reservation.start_time.slice(11, 16),
        endTime: reservation.end_time.slice(11, 16),
      },
      unitRows,
      existing
    );
  }, [reservation, reservationRows, unitRows]);

  const status = (reservation?.status ?? "pending") as ReservationStatus;

  function openReason(action: "cancelled" | "no_show") {
    setPendingAction(action);
    setDialogOpen(true);
  }

  function confirmReason() {
    if (pendingAction && reservation) {
      updateReservation.mutate({ id: reservation.id, status: pendingAction });
    }
    setDialogOpen(false);
  }

  return (
    <div className="space-y-4">
      {!storeId ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {"\uAC00\uAC8C \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
        </div>
      ) : null}
      {storeId && !reservation ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          {"\uC608\uC57D \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">예약 상세</h1>
          <p className="text-sm text-slate-500">예약 번호: {reservationId}</p>
        </div>
        <Badge className={statusStyles[status]}>{statusLabels[status]}</Badge>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
        <div className="text-sm text-slate-600">
          고객: {reservation?.guest_name ?? "-"}
        </div>
        <div className="text-sm text-slate-600">
          인원: {reservation?.party_size ?? "-"}
        </div>
        <div className="text-sm text-slate-600">
          날짜/시간: {reservation?.date ?? "-"} {reservation?.start_time?.slice(11, 16) ?? ""}
        </div>
        <div className="text-sm text-slate-600">
          연락처: {reservation?.guest_phone ?? "-"}
        </div>
        <div className="text-sm text-slate-600">
          요청 사항: {reservation?.notes ?? "-"}
        </div>
        <div className="text-sm text-slate-600">
          배정된 테이블:
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
            value={selectedTableValue || currentTableValue}
            onChange={(event) => setSelectedTableValue(event.target.value)}
          >
            {tableOptions.length === 0 ? (
              <option value="">테이블 정보가 없습니다</option>
            ) : (
              tableOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))
            )}
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              const next = tableOptions.find(
                (item) => item.value === selectedTableValue
              );
              if (!next || !reservation) {
                window.alert("테이블 정보가 없습니다.");
                return;
              }
              updateReservation.mutate({
                id: reservation.id,
                unit_id: next.unit_id,
                unit_index: next.unit_index,
              });
              window.alert("테이블이 변경되었습니다.");
            }}
          >
            변경
          </Button>
          {suggestedAssignment ? (
            <Button
              variant="ghost"
              onClick={() =>
                setSelectedTableValue(
                  `${suggestedAssignment.unit_id}:${suggestedAssignment.unit_index}`
                )
              }
            >
              {"자동 추천"}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={() =>
            reservation ? updateReservation.mutate({ id: reservation.id, status: "confirmed" }) : null
          }
          disabled={!reservation}
        >
          확정
        </Button>
        <Button
          variant="secondary"
          onClick={() => openReason("cancelled")}
          disabled={!reservation}
        >
          취소
        </Button>
        <Button variant="ghost" onClick={() => openReason("no_show")} disabled={!reservation}>
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
