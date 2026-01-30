"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { useTableUnits, type TableUnitRow } from "@/lib/hooks/useTableUnits";

const initialUnits: TableUnitRow[] = [
  {
    id: "unit-1",
    store_id: "dev-store",
    name: "\uD640 4\uC778\uC11D",
    min_capacity: 2,
    max_capacity: 4,
    quantity: 6,
    is_private: false,
  },
  {
    id: "unit-2",
    store_id: "dev-store",
    name: "\uD14C\uB77C\uC2A4 2\uC778\uC11D",
    min_capacity: 1,
    max_capacity: 2,
    quantity: 3,
    is_private: false,
  },
  {
    id: "unit-3",
    store_id: "dev-store",
    name: "VIP \uB8F8",
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
  const pathname = usePathname();
  const resolvedStoreId = useMemo(() => {
    if (storeId) return storeId;
    const match = pathname.match(/\/stores\/([^/]+)/);
    return match ? match[1] : "default";
  }, [storeId, pathname]);

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
      name: form.name.trim() || "\uD14C\uC774\uBE14",
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
          <h1 className="text-2xl font-semibold">{"\uC218\uC6A9\uB7C9 \uAD00\uB9AC"}</h1>
          <p className="text-sm text-slate-500">
            {"\uD14C\uC774\uBE14 \uC720\uD615\uACFC \uC88C\uC11D \uC218\uB7C9\uC744 \uB4F1\uB85D\uD574 \uC8FC\uC138\uC694."}
          </p>
        </div>
        <Button onClick={openAdd}>{"\uD14C\uC774\uBE14 \uD0C0\uC785 \uCD94\uAC00"}</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {unitRows.map((unit) => (
          <Card key={unit.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{unit.name}</span>
                <span className="text-xs text-slate-500">
                  {unit.is_private ? "\uB8F8" : "\uD640"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <div>{"\uCD5C\uC18C \uC778\uC6D0"}: {unit.min_capacity}{"\uBA85"}</div>
              <div>{"\uCD5C\uB300 \uC778\uC6D0"}: {unit.max_capacity}{"\uBA85"}</div>
              <div>{"\uBCF4\uC720 \uC218\uB7C9"}: {unit.quantity}{"\uAC1C"}</div>
              <div className="pt-2">
                <Button variant="secondary" onClick={() => openEdit(unit)}>
                  {"\uC218\uC815"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open}>
        <div className="space-y-4">
          <div className="text-lg font-semibold">
            {editingId ? "\uD14C\uC774\uBE14 \uD0C0\uC785 \uC218\uC815" : "\uD14C\uC774\uBE14 \uD0C0\uC785 \uCD94\uAC00"}
          </div>
          <div className="grid gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">{"\uC774\uB984"}</label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="\uD640 4\uC778\uC11D"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">{"\uCD5C\uC18C \uC778\uC6D0"}</label>
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
                <label className="text-xs text-slate-500">{"\uCD5C\uB300 \uC778\uC6D0"}</label>
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
                <label className="text-xs text-slate-500">{"\uBCF4\uC720 \uC218\uB7C9"}</label>
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
                <label className="text-xs text-slate-500">{"\uB8F8 \uC5EC\uBD80"}</label>
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
                  <option value="no">{"\uC77C\uBC18 \uD640"}</option>
                  <option value="yes">{"\uD504\uB77C\uC774\uBE57 \uB8F8"}</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {"\uCDE8\uC18C"}
            </Button>
            <Button onClick={handleSave}>{"\uC800\uC7A5"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
