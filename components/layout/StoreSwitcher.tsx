"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { StoreSummary } from "@/domain/stores/types";
import { supabase } from "@/lib/supabase/client";

export function StoreSwitcher({ currentStoreId }: { currentStoreId: string | null }) {
  const router = useRouter();
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [storedId, setStoredId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!active) return;
        const userId = userData?.user?.id;
        if (!userId) {
          setStores([]);
          return;
        }
        const { data, error } = await supabase
          .from("places")
          .select("id, name")
          .eq("owner_id", userId)
          .order("id", { ascending: true });
        if (error) throw error;
        if (!active) return;
        setStores(
          (data ?? []).map((store) => ({
            id: store.id,
            name: store.name,
          }))
        );
      } catch (err) {
        console.error(err);
        if (active) setStores([]);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentStoreId) return;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rendezvous_last_store", currentStoreId);
    }
  }, [currentStoreId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const value = window.localStorage.getItem("rendezvous_last_store");
    if (value === "undefined" || value === "null") {
      window.localStorage.removeItem("rendezvous_last_store");
      setStoredId(null);
      return;
    }
    setStoredId(value);
  }, []);

  const selectedId =
    currentStoreId ?? storedId ?? String(stores[0]?.id ?? "");

  useEffect(() => {
    if (!currentStoreId || currentStoreId === "undefined" || currentStoreId === "null") {
      if (storedId) {
        router.replace(`/stores/${storedId}`);
      }
    }
  }, [currentStoreId, storedId, router]);

  return (
    <select
      className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      value={selectedId}
      onChange={(event) => {
        const nextId = event.target.value;
        if (!nextId) return;
        if (typeof window !== "undefined") {
          window.localStorage.setItem("rendezvous_last_store", nextId);
        }
        router.push(`/stores/${nextId}`);
      }}
    >
      {stores.map((store) => (
        <option key={store.id} value={String(store.id)}>
          {store.name}
        </option>
      ))}
    </select>
  );
}
