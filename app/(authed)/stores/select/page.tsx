"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { StoreSummary } from "@/domain/stores/types";

const mockStores: StoreSummary[] = [
  { id: 1, name: "\uB370\uBAA8 \uC2A4\uD1A0\uC5B4" },
  { id: 2, name: "\uC0D8\uD50C \uBD84\uC810" },
];

export default function Page() {
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">\uB9E4\uC7A5 \uC120\uD0DD</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {stores.map((store) => (
          <div
            key={store.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="font-medium">{store.name}</div>
            <div className="text-xs text-slate-500">\uB9E4\uC7A5 \uBC88\uD638: {store.id}</div>
            <Button
              className="mt-3"
              onClick={() => router.push(`/stores/${store.id}`)}
            >
              \uC120\uD0DD
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

