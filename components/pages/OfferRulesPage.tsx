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
    name: "\uD3C9\uC77C \uC800\uB141 4\uC778 \uB8F0",
    enabled: true,
    days: [true, true, true, true, false, false, false],
    timeBlocks: [{ start: "18:00", end: "20:00" }],
    partySize: { min: 4, max: 6 },
    leadTime: { min: 30, max: 240 },
    benefit: { title: "\uC74C\uB8CC 1\uC794" },
  },
  {
    id: 2,
    name: "\uC8FC\uB9D0 \uC810\uC2EC \uB8F0",
    enabled: false,
    days: [false, false, false, false, true, true, true],
    timeBlocks: [{ start: "11:30", end: "14:00" }],
    partySize: { min: 2, max: 4 },
    leadTime: { min: 60, max: 360 },
    benefit: { title: "\uC74C\uB8CC \uC99D\uC815" },
  },
];

const dayLabels = ["\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0", "\uC77C"];

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
          <h1 className="text-2xl font-semibold">\uB8F0 \uBAA9\uB85D</h1>
          <p className="text-sm text-slate-500">\uB9E4\uC7A5 #{storeId}</p>
        </div>
        <Button onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
          \uC0C8 \uB8F0 \uB9CC\uB4E4\uAE30
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
                <div className="text-xs text-slate-500">\uB8F0 \uBC88\uD638: {rule.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() =>
                    router.push(`/stores/${storeId}/offers/rules/${rule.id}/edit`)
                  }
                >
                  \uC218\uC815
                </Button>
                <button
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    rule.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                  onClick={() => toggleRule(rule.id)}
                >
                  {rule.enabled ? "\uD65C\uC131" : "\uBE44\uD65C\uC131"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge>\uC694\uC77C: {formatDays(rule.days)}</Badge>
              <Badge>\uC2DC\uAC04: {formatTimeBlocks(rule.timeBlocks)}</Badge>
              <Badge>
                \uC778\uC6D0: {rule.partySize?.min ?? "-"}~{rule.partySize?.max ?? "-"}
              </Badge>
              <Badge>
                \uB9AC\uB4DC\uD0C0\uC784: {rule.leadTime?.min ?? "-"}~
                {rule.leadTime?.max ?? "-"} \uBD84
              </Badge>
              <Badge>\uD61C\uD0DD: {rule.benefit?.title ?? "-"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
