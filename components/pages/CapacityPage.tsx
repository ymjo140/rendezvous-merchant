"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import type { TableUnit } from "@/domain/stores/types";

const initialUnits: TableUnit[] = [
  {
    id: "unit-1",
    name: "홀 4인석",
    min_capacity: 2,
    max_capacity: 4,
    quantity: 6,
    is_private: false,
  },
  {
    id: "unit-2",
    name: "테라스 2인석",
    min_capacity: 1,
    max_capacity: 2,
    quantity: 3,
    is_private: false,
  },
  {
    id: "unit-3",
    name: "VIP 룸",
    min_capacity: 4,
    max_capacity: 8,
    quantity: 2,
    is_private: true,
  },
];

export function CapacityPage() {
  const [units, setUnits] = useState<TableUnit[]>(initialUnits);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [minCapacity, setMinCapacity] = useState("2");
  const [maxCapacity, setMaxCapacity] = useState("4");
  const [quantity, setQuantity] = useState("1");
  const [isPrivate, setIsPrivate] = useState(false);

  function resetForm() {
    setName("");
    setMinCapacity("2");
    setMaxCapacity("4");
    setQuantity("1");
    setIsPrivate(false);
  }

  function handleAdd() {
    const next: TableUnit = {
      id: `unit-${Date.now()}`,
      name: name.trim() || "테이블",
      min_capacity: Number(minCapacity) || 1,
      max_capacity: Number(maxCapacity) || 2,
      quantity: Number(quantity) || 1,
      is_private: isPrivate,
    };
    setUnits((prev) => [...prev, next]);
    setOpen(false);
    resetForm();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">수용량</h1>
          <p className="text-sm text-slate-500">
            테이블 유형과 좌석 재고를 등록하세요.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>테이블 타입 추가</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {units.map((unit) => (
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
              <div>최소 인원: {unit.min_capacity}명</div>
              <div>최대 인원: {unit.max_capacity}명</div>
              <div>보유 수량: {unit.quantity}개</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open}>
        <div className="space-y-4">
          <div className="text-lg font-semibold">테이블 타입 추가</div>
          <div className="grid gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-500">이름</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="홀 4인석"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs text-slate-500">최소 인원</label>
                <Input
                  type="number"
                  value={minCapacity}
                  onChange={(event) => setMinCapacity(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-slate-500">최대 인원</label>
                <Input
                  type="number"
                  value={maxCapacity}
                  onChange={(event) => setMaxCapacity(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500">수량</label>
              <Input
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(event) => setIsPrivate(event.target.checked)}
              />
              룸(비공개 공간)
            </label>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAdd}>저장</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
