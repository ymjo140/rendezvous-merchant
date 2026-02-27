"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStores, useCreateStore } from "@/hooks/queries/useStores";
import { useAppStore } from "@/stores/useAppStore";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function StoreSwitcher({ currentStoreId }: { currentStoreId: string | null }) {
  const router = useRouter();
  const { data: stores = [], isLoading } = useStores();
  const createStore = useCreateStore();
  const { selectedStoreId, setSelectedStoreId } = useAppStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", address: "" });

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
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">등록된 매장이 없습니다</span>
        <Button className="h-9 px-3" onClick={() => setIsCreateOpen(true)}>
          ➕ 매장 등록하기
        </Button>
        <Dialog open={isCreateOpen}>
          <div className="space-y-4">
            <div className="text-lg font-semibold">새 매장 등록</div>
            <Input
              placeholder="매장 이름"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
            <Input
              placeholder="카테고리 (예: 술집)"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
            />
            <Input
              placeholder="주소"
              value={form.address}
              onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                취소
              </Button>
              <Button
                onClick={async () => {
                  if (!form.name.trim()) {
                    window.alert("매장 이름을 입력해 주세요.");
                    return;
                  }
                  const created = await createStore.mutateAsync({
                    name: form.name.trim(),
                    category: form.category.trim() || undefined,
                    address: form.address.trim() || undefined,
                  });
                  setSelectedStoreId(String(created.id));
                  setForm({ name: "", category: "", address: "" });
                  setIsCreateOpen(false);
                  router.push(`/stores/${created.id}`);
                }}
                disabled={createStore.isPending}
              >
                등록
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    );
  }

  return (
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
    <Dialog open={isCreateOpen}>
      <div className="space-y-4">
        <div className="text-lg font-semibold">새 매장 등록</div>
        <Input
          placeholder="매장 이름"
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Input
          placeholder="카테고리 (예: 술집)"
          value={form.category}
          onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
        />
        <Input
          placeholder="주소"
          value={form.address}
          onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
            취소
          </Button>
          <Button
            onClick={async () => {
              if (!form.name.trim()) {
                window.alert("매장 이름을 입력해 주세요.");
                return;
              }
              const created = await createStore.mutateAsync({
                name: form.name.trim(),
                category: form.category.trim() || undefined,
                address: form.address.trim() || undefined,
              });
              setSelectedStoreId(String(created.id));
              setForm({ name: "", category: "", address: "" });
              setIsCreateOpen(false);
              router.push(`/stores/${created.id}`);
            }}
            disabled={createStore.isPending}
          >
            등록
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
