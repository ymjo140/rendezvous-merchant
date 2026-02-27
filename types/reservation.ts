export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface Reservation {
  id: string;
  storeId: string;
  customerName: string;
  partySize: number;
  reservationTime: string;
  status: ReservationStatus;
  phone?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReservationPayload {
  storeId: string;
  customerName: string;
  partySize: number;
  reservationTime: string;
  status?: ReservationStatus;
  phone?: string;
  notes?: string;
}
