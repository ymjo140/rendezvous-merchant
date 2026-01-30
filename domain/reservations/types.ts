export type Reservation = {
  id: number | string;
  store_id: number | string;
  guest_name: string;
  party_size: number;
  reserved_at: string;
  start_time: string;
  end_time: string;
  unit_id: string;
  status: "confirmed" | "pending" | "cancelled" | "no_show" | "blocked" | string;
  source?: "internal" | "external" | "manual" | string;
};
