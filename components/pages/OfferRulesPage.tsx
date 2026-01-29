"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

type Rule = {
  id: number | string;
  name: string;
  enabled: boolean;
  days: boolean[];
  timeBlocks: Array<{ start: string; end: string }>;
  partySize?: { min?: number; max?: number };
  leadTime?: { min?: number; max?: number };
  benefit?: { title?: string };
};

const fallbackRules: Rule[] = [
  {
    id: 1,
    name: "평일 저녁 4인 룰",
    enabled: true,
    days: [true, true, true, true, false, false, false],
    timeBlocks: [{ start: "18:00", end: "20:00" }],
    partySize: { min: 4, max: 6 },
    leadTime: { min: 30, max: 240 },
    benefit: { title: "음료 1잔" },
  },
  {
    id: 2,
    name: "주말 점심 룰",
    enabled: false,
    days: [false, false, false, false, true, true, true],
    timeBlocks: [{ start: "11:30", end: "14:00" }],
    partySize: { min: 2, max: 4 },
    leadTime: { min: 60, max: 360 },
    benefit: { title: "음료 증정" },
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
  return blocks.map((block) => `${block.start}~${block.end}`).join(", ");
}

export function OfferRulesPage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(fallbackRules);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!storeId || !baseURL) {
        setRules(fallbackRules);
        return;
      }
      try {
        const data = await fetchWithAuth<Rule[]>(endpoints.offerRules(storeId));
        if (active && Array.isArray(data)) {
          setRules(data);
        }
      } catch {
        if (active) setRules(fallbackRules);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [storeId]);

  async function toggleRule(ruleId: number | string) {
    setRules((prev) =>
      prev.map((item) =>
        item.id === ruleId ? { ...item, enabled: !item.enabled } : item
      )
    );

    if (!storeId || !baseURL) return;

    try {
      const target = rules.find((item) => item.id === ruleId);
      if (!target) return;
      await fetchWithAuth(endpoints.offerRules(storeId), {
        method: "PATCH",
        body: JSON.stringify({ id: ruleId, enabled: !target.enabled }),
      });
    } catch {
      // ignore in dev
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">룰 목록</h1>
          <p className="text-sm text-slate-500">매장 #{storeId}</p>
        </div>
        <Button onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
          새 룰 만들기
        </Button>
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{rule.name}</div>
                <div className="text-xs text-slate-500">
                  {formatDays(rule.days)} · {formatTimeBlocks(rule.timeBlocks)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                  {rule.enabled ? "활성" : "비활성"}
                </Badge>
                <Button
                  variant="ghost"
                  onClick={() => toggleRule(rule.id)}
                >
                  {rule.enabled ? "끄기" : "켜기"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/stores/${storeId}/offers/rules/${rule.id}/edit`)
                  }
                >
                  수정
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                적용할 시간대: {formatTimeBlocks(rule.timeBlocks)}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                인원 제한: {rule.partySize?.min ?? "-"}~{rule.partySize?.max ?? "-"}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                예약 마감/오픈: {rule.leadTime?.min ?? "-"}~{rule.leadTime?.max ?? "-"}분
              </span>
              {rule.benefit?.title ? (
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  혜택: {rule.benefit.title}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}