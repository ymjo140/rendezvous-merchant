import { useQuery } from "@tanstack/react-query";
import { getReservations } from "@/lib/api/reservations";

export function useReservations(storeId?: string) {
  return useQuery({
    queryKey: ["reservations", storeId],
    queryFn: () => getReservations(storeId as string),
    enabled: Boolean(storeId),
  });
}
