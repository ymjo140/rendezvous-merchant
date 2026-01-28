"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HotDealCard } from "@/components/offers/HotDealCard";
import { BenefitType } from "@/domain/offers/types";

const mockRules = [
  {
    id: "1",
    name: "\uD3C9\uC77C \uC800\uB141 4\uC778 \uB8F0",
    benefitType: BenefitType.TIME_EXTENSION,
    benefitValue: "30\uBD84",
    visibility: "public" as const,
  },
  {
    id: "2",
    name: "\uC8FC\uB9D0 \uC810\uC2EC \uB8F0",
    benefitType: BenefitType.SPACE_UPGRADE,
    benefitValue: "4\uC778\uC2E4 \u2192 6\uC778\uC2E4",
    visibility: "private" as const,
  },
  {
    id: "3",
    name: "\uD2B9\uAC00 \uBA54\uB274 \uC81C\uC548",
    benefitType: BenefitType.FREE_MENU_ITEM,
    benefitValue: "\uC74C\uB8CC 1\uC794",
    visibility: "public" as const,
  },
];

function buildBenefitMessage(type: BenefitType, value: string) {
  switch (type) {
    case BenefitType.TIME_EXTENSION:
      return `\u23F0 \uC774\uC6A9 \uC2DC\uAC04 ${value || "30\uBD84"} \uC5F0\uC7A5 \uD61C\uD0DD!`;
    case BenefitType.EARLY_ACCESS:
      return `\u23F0 ${value || "10\uBD84"} \uC77C\uCC0D \uC785\uC7A5 \uD61C\uD0DD!`;
    case BenefitType.LATE_CHECKOUT:
      return `\u23F0 ${value || "10\uBD84"} \uB2A6\uAC8C \uCCB4\uD06C\uC544\uC6C3 \uD61C\uD0DD!`;
    case BenefitType.SPACE_UPGRADE:
      return `\u2728 ${value || "\uB8F8 \uC5C5\uADF8\uB808\uC774\uB4DC"} \uBB34\uB8CC \uC5C5\uADF8\uB808\uC774\uB4DC!`;
    case BenefitType.FREE_EQUIPMENT:
      return `\u2728 ${value || "\uC7A5\uBE44"} \uB300\uC5EC \uD61C\uD0DD!`;
    case BenefitType.CORKAGE_FREE:
      return "\u2728 \uCF5C\uD0A4\uC9C0 \uD504\uB9AC \uD61C\uD0DD!";
    case BenefitType.FREE_MENU_ITEM:
      return `\uD83C\uDF7D ${value || "\uBA54\uB274 \uC99D\uC815"} \uD61C\uD0DD!`;
    case BenefitType.SIZE_UPGRADE:
      return `\uD83C\uDF7D ${value || "\uC0AC\uC774\uC988\uC5C5"} \uD61C\uD0DD!`;
    case BenefitType.UNLIMITED_REFILL:
      return "\uD83C\uDF7D \uBB34\uC81C\uD55C \uB9AC\uD544 \uD61C\uD0DD!";
    case BenefitType.PERCENT_DISCOUNT:
      return `\uD83D\uDCB8 ${value || "10%"} \uD560\uC778 \uD61C\uD0DD!`;
    case BenefitType.FIXED_AMOUNT_OFF:
      return `\uD83D\uDCB8 ${value || "5000\uC6D0"} \uD560\uC778 \uD61C\uD0DD!`;
    default:
      return value || "\uD61C\uD0DD";
  }
}

export function RuleSimulatorPage() {
  const [selected, setSelected] = useState(mockRules[0]);

  const previewMessage = useMemo(
    () => buildBenefitMessage(selected.benefitType, selected.benefitValue),
    [selected]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">\uB8F0 \uC2DC\uBBAC\uB808\uC774\uD130</h1>
        <p className="text-sm text-slate-500">\uB8F0\uC744 \uC120\uD0DD\uD558\uBA74 \uC2E4\uC81C \uCE74\uB4DC \uBDF0\uB85C \uBCF4\uC5EC\uC9D1\uB2C8\uB2E4.</p>
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
        benefit={previewMessage}
        timer="\uB9C8\uAC10\uAE4C\uC9C0 01:20"
        visibility={selected.visibility}
      />
    </div>
  );
}
