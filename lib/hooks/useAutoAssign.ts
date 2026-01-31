import type { TableUnit } from "@/domain/stores/types";

export type AssignReservationInput = {
  partySize: number;
  date: string;
  startTime: string;
  endTime: string;
};

export type ReservationSlot = {
  date: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show" | "blocked";
  unit_id: string;
  unit_index: number;
  start_time: string;
  end_time: string;
};

export type AssignmentResult = {
  unit_id: string;
  unit_index: number;
  label: string;
};

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const aS = timeToMinutes(aStart);
  const aE = timeToMinutes(aEnd);
  const bS = timeToMinutes(bStart);
  const bE = timeToMinutes(bEnd);
  return aS < bE && aE > bS;
}

export function autoAssign(
  input: AssignReservationInput,
  tableUnits: TableUnit[],
  existingReservations: ReservationSlot[]
): AssignmentResult | null {
  const candidates = tableUnits
    .filter(
      (unit) =>
        unit.max_capacity >= input.partySize &&
        unit.min_capacity <= input.partySize
    )
    .sort((a, b) => a.max_capacity - b.max_capacity);

  for (const unit of candidates) {
    for (let index = 1; index <= unit.quantity; index += 1) {
      const conflict = existingReservations.some((reservation) => {
        if (reservation.date !== input.date) return false;
        if (reservation.unit_id !== unit.id) return false;
        if (reservation.unit_index !== index) return false;
        if (
          reservation.status === "cancelled" ||
          reservation.status === "no_show"
        ) {
          return false;
        }
        return overlaps(
          input.startTime,
          input.endTime,
          reservation.start_time.slice(11, 16),
          reservation.end_time.slice(11, 16)
        );
      });
      if (!conflict) {
        return {
          unit_id: unit.id,
          unit_index: index,
          label: `${unit.name}-${index}`,
        };
      }
    }
  }
  return null;
}
