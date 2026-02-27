import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createMerchantStore, getMerchantStores } from "@/lib/api/stores";

export function useStores() {
  return useQuery({
    queryKey: ["merchant-stores"],
    queryFn: getMerchantStores,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMerchantStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-stores"] });
    },
  });
}
