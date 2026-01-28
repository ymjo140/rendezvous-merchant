export type Reservation = {
  id: number | string;
  store_id: number | string;
  guest_name: string;
  party_size: number;
  reserved_at: string;
  status: "confirmed" | "pending" | "canceled" | string;
};


