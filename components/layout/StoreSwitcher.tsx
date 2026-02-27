"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStores } from "@/hooks/queries/useStores";
import { useAppStore } from "@/stores/useAppStore";

export function StoreSwitcher({ currentStoreId }: { currentStoreId: string | null }) {
  const router = useRouter();
  const { data: stores = [], isLoading } = useStores();
  const { selectedStoreId, setSelectedStoreId } = useAppStore();

  useEffect(() => {
    if (currentStoreId && currentStoreId !== selectedStoreId) {
      setSelectedStoreId(currentStoreId);
    }
  }, [currentStoreId, selectedStoreId, setSelectedStoreId]);

  useEffect(() => {
    if (!selectedStoreId && stores.length > 0) {
      setSelectedStoreId(String(stores[0].id));
    }
  }, [selectedStoreId, stores, setSelectedStoreId]);

  const resolvedId =
    selectedStoreId ?? currentStoreId ?? (stores[0]?.id ? String(stores[0]?.id) : "");

  if (isLoading) {
    return (
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-400"
        disabled
        value=""
      >
        <option value="">매장 불러오는 중...</option>
      </select>
    );
  }

  if (!stores.length) {
    return (
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-400"
        disabled
        value=""
      >
        <option value="">등록된 매장이 없습니다</option>
      </select>
    );
  }

  return (
    <select
      className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
      value={resolvedId}
      onChange={(event) => {
        const nextId = event.target.value;
        if (!nextId) return;
        setSelectedStoreId(nextId);
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
