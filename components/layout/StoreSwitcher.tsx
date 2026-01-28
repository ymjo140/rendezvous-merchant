"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { StoreSummary } from "@/domain/stores/types";

const mockStores: StoreSummary[] = [
  { id: 1, name: "\uB370\uBAA8 \uC2A4\uD1A0\uC5B4" },
  { id: 2, name: "\uC0D8\uD50C \uBD84\uC810" },
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

  const selectedId = currentStoreId ?? String(stores[0]?.id ?? "");

  return (
    <select
      className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      value={selectedId}
      onChange={(event) => {
        const nextId = event.target.value;
        if (!nextId) return;
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
