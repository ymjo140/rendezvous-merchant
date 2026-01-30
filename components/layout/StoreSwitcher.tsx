"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { StoreSummary } from "@/domain/stores/types";

const mockStores: StoreSummary[] = [
  { id: 1, name: "\uACE0\uB824\uB300\uC810" },
  { id: 2, name: "\uC548\uC554 2\uD638\uC810" },
  { id: "dev-store", name: "\uD14C\uC2A4\uD2B8 \uB9E4\uC7A5" },
];

export function StoreSwitcher({ currentStoreId }: { currentStoreId: string | null }) {
  const router = useRouter();
  const [stores, setStores] = useState<StoreSummary[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await fetchWithAuth<StoreSummary[]>(endpoints.merchantStores);
        if (active) setStores(data);
      } catch {
        if (active) setStores(mockStores);
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

  const storedId =
    typeof window !== "undefined"
      ? window.localStorage.getItem("rendezvous_last_store")
      : null;
  const selectedId =
    currentStoreId ?? storedId ?? String(stores[0]?.id ?? "");

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
