"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useTableUnits, type TableUnitRow } from "@/lib/hooks/useTableUnits";
import { useStoreId } from "@/components/layout/Layout";

const initialUnits: TableUnitRow[] = [
  {
    id: "unit-1",
    store_id: "dev-store",
    name: "홀 4인석",
    min_capacity: 2,
    max_capacity: 4,
    quantity: 6,
    is_private: false,
  },
  {
    id: "unit-2",
    store_id: "dev-store",
    name: "테라스 2인석",
    min_capacity: 1,
    max_capacity: 2,
    quantity: 3,
    is_private: false,
  },
  {
    id: "unit-3",
    store_id: "dev-store",
    name: "VIP 룸",
    min_capacity: 4,
    max_capacity: 8,
    quantity: 2,
    is_private: true,
  },
];

type FormState = {
  id?: string;
  name: string;
  minCapacity: string;
  maxCapacity: string;
  quantity: string;
  isPrivate: boolean;
};

export function CapacityPage({ storeId }: { storeId?: string }) {
  const contextStoreId = useStoreId();
  const resolvedStoreId = useMemo(() => {
    if (storeId && storeId !== "undefined" && storeId !== "null") return storeId;
    if (contextStoreId) return contextStoreId;
    return undefined;
  }, [storeId, contextStoreId]);

  // ⚠️ 훅은 조건부 return보다 먼저(훅 순서 고정)
  const { data: unitRows = [], createUnit, updateUnit, isSupabaseConfigured } =
    useTableUnits(resolvedStoreId);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    minCapacity: "2",
    maxCapacity: "4",
    quantity: "1",
    isPrivate: false,
  });

  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (unitRows.length > 0) return;
    if (!resolvedStoreId) return;
    initialUnits.forEach((unit) => {
      createUnit.mutate({ ...unit, store_id: resolvedStoreId });
    });
  }, [isSupabaseConfigured, unitRows.length, resolvedStoreId, createUnit]);

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요."}
      </div>
    );
  }

  function resetForm() {
    setForm({
      name: "",
      minCapacity: "2",
      maxCapacity: "4",
      quantity: "1",
      isPrivate: false,
    });
    setEditingId(null);
  }

  function openAdd() {
    resetForm();
    setOpen(true);
  }

  function openEdit(unit: TableUnitRow) {
    setEditingId(unit.id);
    setForm({
      name: unit.name,
      minCapacity: String(unit.min_capacity),
      maxCapacity: String(unit.max_capacity),
      quantity: String(unit.quantity),
      isPrivate: unit.is_private,
    });
    setOpen(true);
  }

  function handleSave() {
    const nextUnit: TableUnitRow = {
      id: editingId ?? crypto.randomUUID(),
      store_id: resolvedStoreId ?? "dev-store",
      name: form.name.trim() || "테이블",
      min_capacity: Number(form.minCapacity) || 1,
      max_capacity: Number(form.maxCapacity) || 2,
      quantity: Number(form.quantity) || 1,
      is_private: form.isPrivate,
    };

    if (editingId) {
      const { id, ...payload } = nextUnit;
      updateUnit.mutate({ id, ...payload });
    } else {
      createUnit.mutate(nextUnit);
    }

    setOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{"수용량 관리"}</h1>
          <p className="text-sm text-slate-500">
            {"테이블 유형과 좌석 수량을 등록해 주세요."}
          </p>
        </div>
        <Button onClick={openAdd}>{"테이블 타입 추가"}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {unitRows.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{unit.name}</span>
                <span className="text-xs text-slate-500">
                  {unit.is_private ? "룸" : "홀"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <div>{"최소 인원"}: {unit.min_capacity}{"명"}</div>
              <div>{"최대 인원"}: {unit.max_capacity}{"명"}</div>
              <div>{"보유 수량"}: {unit.quantity}{"개"}</div>
              <div className="pt-2">
                <Button variant="secondary" onClick={() => openEdit(unit)}>
                  {"수정"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open}>
        <div className="space-y-4">
          <div className="text-lg font-semibold">
            {editingId ? "테이블 타입 수정" : "테이블 타입 추가"}
          </div>
          <div className="grid gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"이름"}</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="홀 4인석"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"최소 인원"}</label>
                <Input
                  type="number"
                  value={form.minCapacity}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      minCapacity: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"최대 인원"}</label>
                <Input
                  type="number"
                  value={form.maxCapacity}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      maxCapacity: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"보유 수량"}</label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"룸 여부"}</label>
                <select
                  className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  value={form.isPrivate ? "yes" : "no"}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      isPrivate: event.target.value === "yes",
                    }))
                  }
                >
                  <option value="no">{"일반 홀"}</option>
                  <option value="yes">{"프라이빗 룸"}</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {"취소"}
            </Button>
            <Button onClick={handleSave}>{"저장"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
