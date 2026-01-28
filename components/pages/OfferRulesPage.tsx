"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const initialRules = [
  {
    id: 1,
    name: "월-목 저녁 4인",
    enabled: true,
    days: [true, true, true, true, false, false, false],
    timeBlocks: [{ start: "18:00", end: "20:00" }],
    partySize: { min: 4, max: 6 },
    leadTime: { min: 30, max: 240 },
    benefit: { title: "10% 할인", type: "percentage_discount" },
  },
  {
    id: 2,
    name: "주말 점심",
    enabled: false,
    days: [false, false, false, false, true, true, true],
    timeBlocks: [{ start: "11:30", end: "14:00" }],
    partySize: { min: 2, max: 4 },
    leadTime: { min: 60, max: 360 },
    benefit: { title: "음료 1잔", type: "free_item" },
  },
];

const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];

function formatDays(days: boolean[]) {
  return days
    .map((enabled, index) => (enabled ? dayLabels[index] : null))
    .filter(Boolean)
    .join(", ");
}

function formatTimeBlocks(blocks: Array<{ start: string; end: string }>) {
  return blocks.map((block) => ${block.start}~).join(", ");
}

export function OfferRulesPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Offer Rules</h1>
          <p className="text-sm text-slate-500">Store #{storeId}</p>
        </div>
        <Button onClick={() => router.push(/stores//offers/rules/new)}>
          새 규칙 만들기
        </Button>
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{rule.name}</div>
                <div className="text-xs text-slate-500">Rule ID: {rule.id}</div>
              </div>
              <button
                className={ounded-full px-3 py-1 text-xs font-medium }
                onClick={() =>
                  setRules((prev) =>
                    prev.map((item) =>
                      item.id === rule.id
                        ? { ...item, enabled: !item.enabled }
                        : item
                    )
                  )
                }
              >
                {rule.enabled ? "Enabled" : "Disabled"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge>요일: {formatDays(rule.days)}</Badge>
              <Badge>시간: {formatTimeBlocks(rule.timeBlocks)}</Badge>
              <Badge>인원: {rule.partySize.min}~{rule.partySize.max}</Badge>
              <Badge>리드타임: {rule.leadTime.min}~{rule.leadTime.max}분</Badge>
              <Badge>혜택: {rule.benefit.title}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}