import { useQuery } from "@tanstack/react-query";
import { getMerchantStores } from "@/lib/api/stores";

export function useStores() {
  return useQuery({
    queryKey: ["merchant-stores"],
    queryFn: getMerchantStores,
  });
}
