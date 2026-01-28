import { baseURL } from "@/lib/api/client";
import { fetchWithAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { UserMe } from "@/domain/auth/types";
import { useCallback, useEffect, useState } from "react";

const mockMe: UserMe = {
  user_id: 0,
  roles: ["owner"],
  accessible_store_ids: [1],
};

export function useMe() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!baseURL) {
        setMe(mockMe);
        return;
      }

      const data = await fetchWithAuth<UserMe>(endpoints.usersMe);
      setMe(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setMe(mockMe);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { me, loading, error, refresh: load };
}


