import { apiRequest } from "@/lib/api-client";
import type { Reservation, ReservationPayload } from "@/types/reservation";

export async function getReservations(storeId: string) {
  return apiRequest<Reservation[]>(`/reservations?storeId=${storeId}`);
}

export async function createReservation(data: ReservationPayload) {
  return apiRequest<Reservation>("/reservations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReservation(id: string, data: Partial<ReservationPayload>) {
  return apiRequest<Reservation>(`/reservations/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
