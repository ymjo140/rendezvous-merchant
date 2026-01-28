"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const benefitTypes = [
  { value: "percentage_discount", label: "Percent" },
  { value: "fixed_discount", label: "Fixed" },
  { value: "free_item", label: "Free Item" },
  { value: "set_menu", label: "Set Menu" },
  { value: "other", label: "Other" },
];

const fallbackBenefits = [
  { id: 1, title: "Free drink", type: "free_item", value: "Americano", active: true },
  { id: 2, title: "10% off", type: "percentage_discount", value: "10%", active: true },
];

export function BenefitsCatalogPage({ storeId }: { storeId?: string }) {
  const [benefits, setBenefits] = useState<any[]>(fallbackBenefits);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("percentage_discount");
  const [value, setValue] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!storeId || !baseURL) {
        setBenefits(fallbackBenefits);
        return;
      }
      try {
        const data = await fetchWithAuth<any[]>(endpoints.benefits(storeId));
        if (active && Array.isArray(data)) {
          setBenefits(data as any);
        }
      } catch {
        if (active) setBenefits(fallbackBenefits);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [storeId]);

  async function handleAdd() {
    if (!title) return;

    const next = {
      id: benefits.length + 1,
      title,
      type,
      value,
      active: true,
    };

    setBenefits((prev) => [...prev, next]);
    setTitle("");
    setValue("");

    if (!storeId || !baseURL) return;

    try {
      await fetchWithAuth(endpoints.benefits(storeId), {
        method: "POST",
        body: JSON.stringify(next),
      });
    } catch {
      // ignore in dev
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Benefits Catalog</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="text-sm font-medium">Add benefit</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" />
          <Select value={type} onChange={(event) => setType(event.target.value)}>
            {benefitTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Value" />
        </div>
        <Button onClick={handleAdd}>Add benefit</Button>
      </div>

      <div className="space-y-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{benefit.title}</div>
                <div className="text-xs text-slate-500">{benefit.type}</div>
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  setBenefits((prev) =>
                    prev.map((item) =>
                      item.id === benefit.id ? { ...item, active: !item.active } : item
                    )
                  )
                }
              >
                {benefit.active ? "Disable" : "Enable"}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge>Value: {benefit.value || "-"}</Badge>
              <Badge>{benefit.active ? "Active" : "Inactive"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}