"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStores, useCreateStore } from "@/hooks/queries/useStores";
import { useAppStore } from "@/stores/useAppStore";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

const MIN_QUERY_LENGTH = 2;

type PlaceOption = {
  id: string | number;
  name: string;
  address?: string | null;
  category?: string | null;
};

export function StoreSwitcher({ currentStoreId }: { currentStoreId: string | null }) {
  const router = useRouter();
  const { data: stores = [], isLoading } = useStores();
  const createStore = useCreateStore();
  const { selectedStoreId, setSelectedStoreId } = useAppStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceOption[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceOption | null>(null);

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

  useEffect(() => {
    if (!isCreateOpen) {
      setQuery("");
      setResults([]);
      setSelectedPlace(null);
      setIsSearching(false);
    }
  }, [isCreateOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!isCreateOpen || trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    let active = true;
    setIsSearching(true);

    const run = async () => {
      const { data, error } = await supabase
        .from("places")
        .select("id, name, address, category")
        .ilike("name", `%${trimmed}%`)
        .limit(10);

      if (!active) return;
      if (error) {
        console.error(error);
        setResults([]);
      } else {
        setResults((data ?? []) as PlaceOption[]);
      }
      setIsSearching(false);
    };

    void run();

    return () => {
      active = false;
    };
  }, [query, isCreateOpen]);

  const resolvedId =
    selectedStoreId ?? currentStoreId ?? (stores[0]?.id ? String(stores[0]?.id) : "");

  const handleSubmit = async () => {
    if (!selectedPlace) {
      window.alert("매장을 선택해 주세요.");
      return;
    }

    const created = await createStore.mutateAsync({
      place_id: selectedPlace.id,
    });

    setSelectedStoreId(String(created.id));
    setIsCreateOpen(false);
    router.push(`/stores/${created.id}`);
  };

  const createDialog = (
    <Dialog open={isCreateOpen}>
      <div className="space-y-4">
        <div className="text-lg font-semibold">매장 검색 후 등록</div>
        <div className="relative">
          <Input
            placeholder="매장 이름을 검색하세요"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedPlace(null);
            }}
          />
          {query.trim().length >= MIN_QUERY_LENGTH && (
            <div className="absolute z-10 mt-2 w-full rounded-md border border-slate-200 bg-white shadow-lg">
              {isSearching ? (
                <div className="px-3 py-2 text-sm text-slate-500">검색 중...</div>
              ) : results.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-400">검색 결과가 없습니다.</div>
              ) : (
                results.map((place) => (
                  <button
                    key={place.id}
                    type="button"
                    className="flex w-full flex-col gap-1 border-b border-slate-100 px-3 py-2 text-left text-sm hover:bg-slate-50"
                    onClick={() => {
                      setSelectedPlace(place);
                      setQuery(place.name);
                      setResults([]);
                    }}
                  >
                    <span className="font-medium text-slate-900">{place.name}</span>
                    <span className="text-xs text-slate-500">{place.address ?? "주소 미등록"}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {selectedPlace && (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
            <div className="text-slate-700">선택된 매장: {selectedPlace.name}</div>
            <div className="text-slate-500">카테고리: {selectedPlace.category ?? "-"}</div>
            <div className="text-slate-500">주소: {selectedPlace.address ?? "-"}</div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPlace || createStore.isPending}>
            등록
          </Button>
        </div>
      </div>
    </Dialog>
  );

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
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">등록된 매장이 없습니다</span>
        <Button className="h-9 px-3" onClick={() => setIsCreateOpen(true)}>
          ➕ 매장 등록하기
        </Button>
        {createDialog}
      </div>
    );
  }

  return (
    <>
      <select
        className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
        value={resolvedId}
        onChange={(event) => {
          const nextId = event.target.value;
          if (nextId === "__create__") {
            setIsCreateOpen(true);
            return;
          }
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
        <option value="__create__">➕ 새 매장 추가</option>
      </select>
      {createDialog}
    </>
  );
}
