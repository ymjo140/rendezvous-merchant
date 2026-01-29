import type { TableUnit } from "@/domain/stores/types";
import type { Reservation } from "@/domain/reservations/types";

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

const mockReservations: Reservation[] = [
  {
    id: "R-101",
    store_id: 1,
    guest_name: "김민수",
    party_size: 4,
    reserved_at: "2026-02-01T12:00:00",
    start_time: "2026-02-01T18:00:00",
    end_time: "2026-02-01T20:00:00",
    unit_id: "unit-hall-4",
    status: "confirmed",
  },
  {
    id: "R-102",
    store_id: 1,
    guest_name: "이지현",
    party_size: 2,
    reserved_at: "2026-02-01T12:20:00",
    start_time: "2026-02-01T19:00:00",
    end_time: "2026-02-01T21:00:00",
    unit_id: "unit-terrace-2",
    status: "pending",
  },
  {
    id: "R-103",
    store_id: 1,
    guest_name: "박성준",
    party_size: 6,
    reserved_at: "2026-02-01T13:00:00",
    start_time: "2026-02-01T20:30:00",
    end_time: "2026-02-01T22:30:00",
    unit_id: "unit-vip",
    status: "confirmed",
  },
];

export function checkAvailability(
  storeId: number | string,
  targetTime: string,
  partySize: number
) {
  const units = mockUnits.filter(
    (unit) => unit.min_capacity <= partySize && unit.max_capacity >= partySize
  );

  if (!units.length) return false;

  const target = new Date(targetTime);
  const windowStart = new Date(target.getTime() - 2 * 60 * 60 * 1000);
  const windowEnd = new Date(target.getTime() + 2 * 60 * 60 * 1000);

  const overlapping = mockReservations.filter((reservation) => {
    if (String(reservation.store_id) !== String(storeId)) return false;
    const start = new Date(reservation.start_time);
    const end = new Date(reservation.end_time);
    return start < windowEnd && end > windowStart;
  });

  return units.some((unit) => {
    const used = overlapping.filter((reservation) => reservation.unit_id === unit.id)
      .length;
    return unit.quantity - used > 0;
  });
}
