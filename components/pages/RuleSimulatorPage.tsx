"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { HotDealCard } from "@/components/offers/HotDealCard";

const mockRules = [
  {
    id: "1",
    name: "Weekday dinner for 4",
    benefit: "10% off",
  },
  {
    id: "2",
    name: "Weekend lunch",
    benefit: "Free drink",
  },
];

export function RuleSimulatorPage() {
  const [selected, setSelected] = useState(mockRules[0]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Rule Simulator</h1>
        <p className="text-sm text-slate-500">Pick a rule to preview.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {mockRules.map((rule) => (
          <Button
            key={rule.id}
            variant={selected.id === rule.id ? "primary" : "secondary"}
            onClick={() => setSelected(rule)}
          >
            {rule.name}
          </Button>
        ))}
      </div>
      <HotDealCard
        title={selected.name}
        benefit={selected.benefit}
        timer="Ends in 01:20"
        visibility="public"
      />
    </div>
  );
}
