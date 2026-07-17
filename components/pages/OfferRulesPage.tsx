"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRules, type RuleRow } from "@/lib/hooks/useRules";
import { useStoreId } from "@/components/layout/Layout";

const dayLabels = [
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
  "일",
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

  // ⚠️ 훅은 조건부 return보다 먼저 — 매장 미선택→선택 전환 시 훅 순서가 변하면 크래시
  const { data: rules = [], updateRule, deleteRule } = useRules(resolvedStoreId);

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요."}
      </div>
    );
  }

  function toggleRule(ruleId: RuleRow["id"]) {
    const target = rules.find((item) => String(item.id) === String(ruleId));
    if (!target) return;
    updateRule.mutate({ id: String(ruleId), enabled: !target.enabled });
  }

  function handleDelete(ruleId: RuleRow["id"]) {
    if (!window.confirm("룰을 삭제할까요?")) return;
    deleteRule.mutate({ id: String(ruleId) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{"룰 목록"}</h1>
          <p className="text-sm text-slate-500">{`매장 #${resolvedStoreId}`}</p>
        </div>
        <Button onClick={() => router.push(`/stores/${resolvedStoreId}/offers/rules/new`)}>
          {"새 룰 만들기"}
        </Button>
      </div>
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            {"등록된 룰이 없습니다. 새 룰을 만들어 주세요."}
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
                  {rule.enabled ? "활성" : "비활성"}
                </Badge>
                <Button variant="ghost" onClick={() => toggleRule(rule.id)}>
                  {rule.enabled ? "끄기" : "켜기"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() =>
                    router.push(`/stores/${resolvedStoreId}/offers/rules/${rule.id}/edit`)
                  }
                >
                  {"수정"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-rose-600 hover:bg-rose-50"
                  onClick={() => handleDelete(rule.id)}
                >
                  {"삭제"}
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {"적용할 시간대: "}
                {formatTimeBlocks(rule.time_blocks ?? [])}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {"인원 제한: "}
                {rule.party_min ?? "-"}~{rule.party_max ?? "-"}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-1">
                {"예약 마감/오픈: "}
                {rule.lead_min ?? "-"}~{rule.lead_max ?? "-"}{"분"}
              </span>
              {rule.benefit_title ? (
                <span className="rounded-full bg-slate-100 px-2 py-1">
                  {"혜택: "}{rule.benefit_title}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
