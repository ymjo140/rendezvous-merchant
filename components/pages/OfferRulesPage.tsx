"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRules, type RuleRow } from "@/lib/hooks/useRules";
import { useStoreId } from "@/components/layout/Layout";

const dayLabels = [
  "\uC6D4",
  "\uD654",
  "\uC218",
  "\uBAA9",
  "\uAE08",
  "\uD1A0",
  "\uC77C",
];

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
  const contextStoreId = useStoreId();
  const resolvedStoreId = useMemo(() => {
    if (storeId && storeId !== "undefined" && storeId !== "null") return storeId;
    if (contextStoreId) return contextStoreId;
    return undefined;
  }, [storeId, contextStoreId]);

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"\uAC00\uAC8C \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
      </div>
    );
  }

  const { data: rules = [], updateRule, deleteRule } = useRules(resolvedStoreId);

  function toggleRule(ruleId: RuleRow["id"]) {
    const target = rules.find((item) => String(item.id) === String(ruleId));
    if (!target) return;
    updateRule.mutate({ id: String(ruleId), enabled: !target.enabled });
  }

  function handleDelete(ruleId: RuleRow["id"]) {
    if (!window.confirm("\uB8F0\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?")) return;
    deleteRule.mutate({ id: String(ruleId) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{"\uB8F0 \uBAA9\uB85D"}</h1>
          <p className="text-sm text-slate-500">{`\uB9E4\uC7A5 #${resolvedStoreId}`}</p>
        </div>
        <Button onClick={() => router.push(`/stores/${resolvedStoreId}/offers/rules/new`)}>
          {"\uC0C8 \uB8F0 \uB9CC\uB4E4\uAE30"}
        </Button>
      </div>
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            {"\uB4F1\uB85D\uB41C \uB8F0\uC774 \uC5C6\uC2B5\uB2C8\uB2E4. \uC0C8 \uB8F0\uC744 \uB9CC\uB4E4\uC5B4 \uC8FC\uC138\uC694."}
          </div>
        ) : null}
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">{rule.name}</div>
                <div className="text-xs text-slate-500">
                  {formatDays(rule.days ?? [])} · {formatTimeBlocks(rule.time_blocks ?? [])}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    rule.enabled
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }
                >
                  {rule.enabled ? "\uD65C\uC131" : "\uBE44\uD65C\uC131"}
                </Badge>
                <Button variant="ghost" onClick={() => toggleRule(rule.id)}>
                  {rule.enabled ? "\uB044\uAE30" : "\uCF1C\uAE30"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/stores/${resolvedStoreId}/offers/rules/${rule.id}/edit`)
                  }
                >
                  {"\uC218\uC815"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDelete(rule.id)}
                >
                  {"\uC0AD\uC81C"}
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {"\uC801\uC6A9\uD560 \uC2DC\uAC04\uB300: "}
                {formatTimeBlocks(rule.time_blocks ?? [])}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {"\uC778\uC6D0 \uC81C\uD55C: "}
                {rule.party_min ?? "-"}~{rule.party_max ?? "-"}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {"\uC608\uC57D \uB9C8\uAC10/\uC624\uD508: "}
                {rule.lead_min ?? "-"}~{rule.lead_max ?? "-"}{"\uBD84"}
              </span>
              {rule.benefit_title ? (
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  {"\uD61C\uD0DD: "}{rule.benefit_title}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
