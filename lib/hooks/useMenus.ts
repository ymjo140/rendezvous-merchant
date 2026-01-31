import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type MenuRow = {
  id: string;
  store_id: string;
  name: string;
  price: number | null;
  created_at?: string;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchMenus(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as MenuRow[];
  const { data, error } = await supabase
    .from("store_menus")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MenuRow[];
}

export function useMenus(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["store-menus", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchMenus(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`store-menus-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "store_menus",
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);

  const createMenu = useMutation({
    mutationFn: async (payload: Omit<MenuRow, "id">) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase.from("store_menus").insert(payload);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateMenu = useMutation({
    mutationFn: async (payload: Partial<MenuRow> & { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("store_menus")
        .update(payload)
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMenu = useMutation({
    mutationFn: async (id: string) => {
      if (!isSupabaseConfigured) return id;
      const { error } = await supabase.from("store_menus").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    createMenu,
    updateMenu,
    deleteMenu,
    isSupabaseConfigured,
  };
}
