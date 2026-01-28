"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const initialRules = [
  { id: 1, name: "월-목 저녁 4인", enabled: true },
  { id: 2, name: "주말 점심", enabled: false },
];

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
        <Button onClick={() => router.push(`/stores/${storeId}/offers/rules/new`)}>
          새 규칙 만들기
        </Button>
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
          >
            <div>
              <div className="font-medium">{rule.name}</div>
              <div className="text-xs text-slate-500">Rule ID: {rule.id}</div>
            </div>
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                rule.enabled ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
              }`}
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
        ))}
      </div>
    </div>
  );
}


