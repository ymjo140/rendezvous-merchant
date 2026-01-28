"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const benefitTypes = [
  { value: "percentage_discount", label: "% 할인" },
  { value: "fixed_discount", label: "정액 할인" },
  { value: "free_item", label: "무료 메뉴" },
  { value: "set_menu", label: "세트 메뉴" },
  { value: "other", label: "기타" },
];

export function BenefitsCatalogPage() {
  const [benefits, setBenefits] = useState([
    { id: 1, title: "음료 1잔", type: "free_item", value: "아메리카노", active: true },
    { id: 2, title: "10% 할인", type: "percentage_discount", value: "10%", active: true },
  ]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("percentage_discount");
  const [value, setValue] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Benefits Catalog</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="text-sm font-medium">혜택 추가</div>
        <div className="grid gap-3 md:grid-cols-3">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="혜택 이름" />
          <Select value={type} onChange={(event) => setType(event.target.value)}>
            {benefitTypes.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </Select>
          <Input value={value} onChange={(event) => setValue(event.target.value)} placeholder="혜택 값" />
        </div>
        <Button
          onClick={() => {
            if (!title) return;
            setBenefits((prev) => [
              ...prev,
              {
                id: prev.length + 1,
                title,
                type,
                value,
                active: true,
              },
            ]);
            setTitle("");
            setValue("");
          }}
        >
          혜택 추가
        </Button>
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
                {benefit.active ? "비활성" : "활성"}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge>값: {benefit.value || "-"}</Badge>
              <Badge>{benefit.active ? "활성" : "비활성"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}