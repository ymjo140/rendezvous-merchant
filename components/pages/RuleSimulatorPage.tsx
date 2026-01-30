"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HotDealCard } from "@/components/offers/HotDealCard";
import { BenefitType } from "@/domain/offers/types";

const mockRules = [
  {
    id: "1",
    name: "?됱씪 ???4??猷?,
    benefitType: BenefitType.TIME_EXTENSION,
    benefitValue: "30遺?,
    visibility: "public" as const,
  },
  {
    id: "2",
    name: "二쇰쭚 ?먯떖 猷?,
    benefitType: BenefitType.SPACE_UPGRADE,
    benefitValue: "4?몄떎 ??6?몄떎",
    visibility: "private" as const,
  },
  {
    id: "3",
    name: "?숈깮 硫붾돱 ?쒖븞",
    benefitType: BenefitType.FREE_MENU_ITEM,
    benefitValue: "?뚮즺 1??,
    visibility: "public" as const,
  },
];

function buildBenefitMessage(type: BenefitType, value: string) {
  switch (type) {
    case BenefitType.TIME_EXTENSION:
      return `???댁슜 ?쒓컙 ${value || "30遺?} ?곗옣 ?쒗깮!`;
    case BenefitType.EARLY_ACCESS:
      return `??${value || "10遺?} ?쇱컢 ?낆옣 ?쒗깮!`;
    case BenefitType.LATE_CHECKOUT:
      return `??${value || "10遺?} ??쾶 泥댄겕?꾩썐 ?쒗깮!`;
    case BenefitType.SPACE_UPGRADE:
      return `??${value || "猷??낃렇?덉씠??} 臾대즺 ?낃렇?덉씠??`;
    case BenefitType.FREE_EQUIPMENT:
      return `??${value || "?λ퉬"} ????쒗깮!`;
    case BenefitType.CORKAGE_FREE:
      return "??肄쒗궎吏 ?꾨━ ?쒗깮!";
    case BenefitType.FREE_MENU_ITEM:
      return `?럞 ${value || "硫붾돱 利앹젙"} ?쒗깮!`;
    case BenefitType.SIZE_UPGRADE:
      return `?럞 ${value || "?ъ씠利덉뾽"} ?쒗깮!`;
    case BenefitType.UNLIMITED_REFILL:
      return "?럞 臾댁젣??由ы븘 ?쒗깮!";
    case BenefitType.PERCENT_DISCOUNT:
      return `?뮯 ${value || "10%"} ?좎씤 ?쒗깮!`;
    case BenefitType.FIXED_AMOUNT_OFF:
      return `?뮯 ${value || "5000??} ?좎씤 ?쒗깮!`;
    default:
      return value || "?쒗깮";
  }
}

export function RuleSimulatorPage() {
  const [selected, setSelected] = useState(mockRules[0]);
  const storeName = "\uD14C\uC2A4\uD2B8 \uB9E4\uC7A5";
  const storeCategory = "\uC2DD\uB2F9/\uBC25\uC9D1";

  const previewMessage = useMemo(
    () => buildBenefitMessage(selected.benefitType, selected.benefitValue),
    [selected]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">猷??쒕??덉씠??/h1>
        <p className="text-sm text-slate-500">
          猷곗쓣 ?좏깮?섎㈃ ?ㅼ젣 移대뱶 UI濡??대뼸寃?蹂댁씠?붿? ?뺤씤?????덉뼱??
        </p>
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
        storeName={storeName}
        category={storeCategory}
      />
    </div>
  );
}

