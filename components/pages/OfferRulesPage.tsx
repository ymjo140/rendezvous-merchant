"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const fallbackRules = [
  {
    id: 1,
    name: "Weekday dinner for 4",
    enabled: true,
    days: [true, true, true, true, false, false, false],
    timeBlocks: [{ start: "18:00", end: "20:00" }],
    partySize: { min: 4, max: 6 },
    leadTime: { min: 30, max: 240 },
    benefit: { title: "10% off", type: "percentage_discount" },
  },
  {
    id: 2,
    name: "Weekend lunch",
    enabled: false,
    days: [false, false, false, false, true, true, true],
    timeBlocks: [{ start: "11:30", end: "14:00" }],
    partySize: { min: 2, max: 4 },
    leadTime: { min: 60, max: 360 },
    benefit: { title: "Free drink", type: "free_item" },
  },
];

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const [rules, setRules] = useState(fallbackRules);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!storeId || !baseURL) {
        setRules(fallbackRules);
        return;
      }
      try {
        const data = await fetchWithAuth<any[]>(endpoints.offerRules(storeId));
        if (active && Array.isArray(data)) {
          setRules(data as any);
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
          <h1 className="text-2xl font-semibold">Offer Rules</h1>
          <p className="text-sm text-slate-500">Store #{storeId}</p>
        </div>
        <Button onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
          New rule
        </Button>
      </div>
      <div className="space-y-3">
        {rules.map((rule: any) => (
          <div
            key={rule.id}
            className="space-y-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{rule.name}</div>
                <div className="text-xs text-slate-500">Rule ID: {rule.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() =>
                    router.push(`/stores/${storeId}/offers/rules/${rule.id}/edit`)
                  }
                >
                  Edit
                </Button>
                <button
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    rule.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                  onClick={() => toggleRule(rule.id)}
                >
                  {rule.enabled ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge>Days: {formatDays(rule.days)}</Badge>
              <Badge>Time: {formatTimeBlocks(rule.timeBlocks)}</Badge>
              <Badge>
                Party: {rule.partySize?.min ?? "-"}~{rule.partySize?.max ?? "-"}
              </Badge>
              <Badge>
                Lead: {rule.leadTime?.min ?? "-"}~{rule.leadTime?.max ?? "-"} min
              </Badge>
              <Badge>Benefit: {rule.benefit?.title ?? "-"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}