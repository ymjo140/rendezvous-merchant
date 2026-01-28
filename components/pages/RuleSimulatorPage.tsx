"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { HotDealCard } from "@/components/offers/HotDealCard";
import { BenefitType } from "@/domain/offers/types";

const mockRules = [
  {
    id: "1",
    name: "평일 저녁 4인 룰",
    benefitType: BenefitType.TIME_EXTENSION,
    benefitValue: "30분",
    visibility: "public" as const,
  },
  {
    id: "2",
    name: "주말 점심 룰",
    benefitType: BenefitType.SPACE_UPGRADE,
    benefitValue: "4인실 → 6인실",
    visibility: "private" as const,
  },
  {
    id: "3",
    name: "특가 메뉴 제안",
    benefitType: BenefitType.FREE_MENU_ITEM,
    benefitValue: "음료 1잔",
    visibility: "public" as const,
  },
];

function buildBenefitMessage(type: BenefitType, value: string) {
  switch (type) {
    case BenefitType.TIME_EXTENSION:
      return `⏰ 이용 시간 ${value || "30분"} 연장 혜택!`;
    case BenefitType.EARLY_ACCESS:
      return `⏰ ${value || "10분"} 일찍 입장 혜택!`;
    case BenefitType.LATE_CHECKOUT:
      return `⏰ ${value || "10분"} 늦게 체크아웃 혜택!`;
    case BenefitType.SPACE_UPGRADE:
      return `✨ ${value || "룸 업그레이드"} 무료 업그레이드!`;
    case BenefitType.FREE_EQUIPMENT:
      return `✨ ${value || "장비"} 대여 혜택!`;
    case BenefitType.CORKAGE_FREE:
      return "✨ 콜키지 프리 혜택!";
    case BenefitType.FREE_MENU_ITEM:
      return `🍽 ${value || "메뉴 증정"} 혜택!`;
    case BenefitType.SIZE_UPGRADE:
      return `🍽 ${value || "사이즈업"} 혜택!`;
    case BenefitType.UNLIMITED_REFILL:
      return "🍽 무제한 리필 혜택!";
    case BenefitType.PERCENT_DISCOUNT:
      return `💸 ${value || "10%"} 할인 혜택!`;
    case BenefitType.FIXED_AMOUNT_OFF:
      return `💸 ${value || "5000원"} 할인 혜택!`;
    default:
      return value || "혜택";
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
        <h1 className="text-2xl font-semibold">룰 시뮬레이터</h1>
        <p className="text-sm text-slate-500">룰을 선택하면 실제 카드 뷰로 보여집니다.</p>
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
        timer="마감까지 01:20"
        visibility={selected.visibility}
      />
    </div>
  );
}
