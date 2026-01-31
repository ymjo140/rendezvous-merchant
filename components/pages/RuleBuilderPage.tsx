"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotDealCard } from "@/components/offers/HotDealCard";
import { BenefitType } from "@/domain/offers/types";
import { useBenefits } from "@/lib/hooks/useBenefits";
import { useRules } from "@/lib/hooks/useRules";
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
const dayCodes = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const benefitTypes = [
  { value: BenefitType.FREE_MENU_ITEM, label: "\uBA54\uB274 \uC99D\uC815" },
  { value: BenefitType.SPACE_UPGRADE, label: "\uB8F8/\uC88C\uC11D \uC5C5\uADF8\uB808\uC774\uB4DC" },
  { value: BenefitType.TIME_EXTENSION, label: "\uC2DC\uAC04 \uC5F0\uC7A5" },
  { value: BenefitType.PERCENT_DISCOUNT, label: "\uC815\uB960 \uD560\uC778" },
  { value: BenefitType.FIXED_AMOUNT_OFF, label: "\uC815\uC561 \uD560\uC778" },
];

const benefitTypeLabelMap: Record<BenefitType, string> = {
  [BenefitType.PERCENT_DISCOUNT]: "\uC815\uB960 \uD560\uC778",
  [BenefitType.FIXED_AMOUNT_OFF]: "\uC815\uC561 \uD560\uC778",
  [BenefitType.FREE_MENU_ITEM]: "\uBA54\uB274 \uC99D\uC815",
  [BenefitType.SIZE_UPGRADE]: "\uC0AC\uC774\uC988\uC5C5",
  [BenefitType.UNLIMITED_REFILL]: "\uBB34\uC81C\uD55C \uB9AC\uD544",
  [BenefitType.TIME_EXTENSION]: "\uC2DC\uAC04 \uC5F0\uC7A5",
  [BenefitType.EARLY_ACCESS]: "\uC5BC\uB9AC \uCCB4\uD06C\uC778",
  [BenefitType.LATE_CHECKOUT]: "\uB808\uC774\uD2B8 \uCCB4\uD06C\uC544\uC6C3",
  [BenefitType.SPACE_UPGRADE]: "\uB8F8/\uC88C\uC11D \uC5C5\uADF8\uB808\uC774\uB4DC",
  [BenefitType.FREE_EQUIPMENT]: "\uC7A5\uBE44 \uB300\uC5EC",
  [BenefitType.CORKAGE_FREE]: "\uCF5C\uD0A4\uC9C0 \uD504\uB9AC",
};

const mockBenefits = [
  { id: "1", title: "\uC74C\uB8CC 1\uC794", type: BenefitType.FREE_MENU_ITEM },
  { id: "2", title: "\uCC3D\uAC00 \uC88C\uC11D", type: BenefitType.SPACE_UPGRADE },
];

const mockRule = {
  name: "\uD3C9\uC77C \uC800\uB141 4\uC778 \uB8F0",
  days: [true, true, true, true, false, false, false],
  timeBlocks: [{ start: "18:00", end: "20:00" }],
  partyMin: "4",
  partyMax: "6",
  leadMin: "30",
  leadMax: "240",
  benefitId: "1",
  benefitType: BenefitType.FREE_MENU_ITEM,
  benefitValue: "\uC74C\uB8CC 1\uC794",
  dailyCap: "20",
  minSpend: "30000",
  visibility: "public",
};

type BenefitItem = {
  id: string | number;
  title: string;
  type?: BenefitType;
};

type RuleResponse = {
  id?: string | number;
  name?: string;
  days?: boolean[];
  timeBlocks?: Array<{ start: string; end: string }>;
  partySize?: { min?: number; max?: number };
  leadTime?: { min?: number; max?: number };
  benefit?: { id?: string | number; type?: BenefitType };
  benefitValue?: string;
  guardrails?: { dailyCap?: number; minSpend?: number };
  visibility?: "public" | "private";
};

type PresetSetters = {
  setName: (value: string) => void;
  setBenefitType: (value: BenefitType) => void;
  setBenefitValue: (value: string) => void;
  setPartyMin: (value: string) => void;
  setPartyMax: (value: string) => void;
  setLeadMin: (value: string) => void;
  setLeadMax: (value: string) => void;
  setTimeBlocks: (value: Array<{ start: string; end: string }>) => void;
  setMinSpend: (value: string) => void;
};

const presets = [
  {
    key: "rainy",
    label: "\u26A1 \uBE44\uC624\uB294 \uB0A0 \uACF5\uC2E4 \uCC44\uC6B0\uAE30",
    apply: (setters: PresetSetters) => {
      setters.setName("\uBE44\uC624\uB294 \uB0A0 \uBC88\uAC1C");
      setters.setBenefitType(BenefitType.FREE_MENU_ITEM);
      setters.setBenefitValue("\uC804/\uB9C9\uAC78\uB9AC");
      setters.setPartyMin("2");
      setters.setPartyMax("4");
      setters.setLeadMin("0");
      setters.setLeadMax("1440");
    },
  },
  {
    key: "group",
    label: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66 \uB2E8\uCCB4 \uD68C\uC2DD \uC720\uCE58",
    apply: (setters: PresetSetters) => {
      setters.setName("\uB2E8\uCCB4 \uD68C\uC2DD \uC6B0\uB300");
      setters.setBenefitType(BenefitType.FREE_MENU_ITEM);
      setters.setBenefitValue("\uC18C\uC8FC 2\uBCD1");
      setters.setPartyMin("6");
      setters.setPartyMax("12");
      setters.setMinSpend("100000");
    },
  },
  {
    key: "closing",
    label: "\u23F0 \uB9C8\uAC10 \uC9C1\uC804 \uD0C0\uC784\uC138\uC77C",
    apply: (setters: PresetSetters) => {
      setters.setName("\uB9C8\uAC10 \uB5A8\uC774 \uD560\uC778");
      setters.setBenefitType(BenefitType.PERCENT_DISCOUNT);
      setters.setBenefitValue("20%");
      setters.setTimeBlocks([{ start: "21:00", end: "23:00" }]);
      setters.setLeadMin("30");
      setters.setLeadMax("240");
    },
  },
];

function buildBenefitMessage(type: BenefitType, value: string) {
  switch (type) {
    case BenefitType.TIME_EXTENSION:
      return `\u23F0 \uC774\uC6A9 \uC2DC\uAC04 ${value || "30\uBD84"} \uC5F0\uC7A5 \uD61C\uD0DD!`;
    case BenefitType.EARLY_ACCESS:
      return `\u23F0 ${value || "10\uBD84"} \uC77C\uCC0D \uC785\uC7A5 \uD61C\uD0DD!`;
    case BenefitType.LATE_CHECKOUT:
      return `\u23F0 ${value || "10\uBD84"} \uB291\uAC8C \uCCB4\uD06C\uC544\uC6C3 \uD61C\uD0DD!`;
    case BenefitType.SPACE_UPGRADE:
      return `\u2728 ${value || "\uB8F8/\uC88C\uC11D \uC5C5\uADF8\uB808\uC774\uB4DC"} \uBB34\uB8CC \uC5C5\uADF8\uB808\uC774\uB4DC!`;
    case BenefitType.FREE_EQUIPMENT:
      return `\u2728 ${value || "\uC7A5\uBE44"} \uB300\uC5EC \uD61C\uD0DD!`;
    case BenefitType.CORKAGE_FREE:
      return "\u2728 \uCF5C\uD0A4\uC9C0 \uD504\uB9AC \uD61C\uD0DD!";
    case BenefitType.FREE_MENU_ITEM:
      return `\uD83C\uDF81 ${value || "\uBA54\uB274 \uC99D\uC815"} \uD61C\uD0DD!`;
    case BenefitType.SIZE_UPGRADE:
      return `\uD83C\uDF81 ${value || "\uC0AC\uC774\uC988\uC5C5"} \uD61C\uD0DD!`;
    case BenefitType.UNLIMITED_REFILL:
      return "\uD83C\uDF81 \uBB34\uC81C\uD55C \uB9AC\uD544 \uD61C\uD0DD!";
    case BenefitType.PERCENT_DISCOUNT:
      return `\uD83D\uDCB8 ${value || "10%"} \uD560\uC778 \uD61C\uD0DD!`;
    case BenefitType.FIXED_AMOUNT_OFF:
      return `\uD83D\uDCB8 ${value || "5000\uC6D0"} \uD560\uC778 \uD61C\uD0DD!`;
    default:
      return value || "\uD61C\uD0DD";
  }
}

export function RuleBuilderPage({
  storeId,
  ruleId,
}: {
  storeId?: string;
  ruleId?: string;
}) {
  const router = useRouter();
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : contextStoreId ?? undefined;

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"\uAC00\uAC8C \uC815\uBCF4\uB97C \uBD88\uB7EC\uC62C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
      </div>
    );
  }

  const storeIdValue = resolvedStoreId;
  const storeName =
    storeIdValue === "dev-store"
      ? "\uD14C\uC2A4\uD2B8 \uB9E4\uC7A5"
      : "\uB370\uBAA8 \uC2A4\uD1A0\uC5B4";
  const storeCategory = "\uC2DD\uB2F9/\uBC25\uC9D1";
  const { data: benefitRows = [] } = useBenefits(storeIdValue);
  const { data: ruleRows = [], createRule, updateRule } = useRules(storeIdValue);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [days, setDays] = useState([true, true, true, true, false, false, false]);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>(
    dayCodes.filter((_, index) => [true, true, true, true, false, false, false][index])
  );
  const [activeTimeStart, setActiveTimeStart] = useState("18:00");
  const [activeTimeEnd, setActiveTimeEnd] = useState("20:00");
  const [isAutoApply, setIsAutoApply] = useState(false);
  const [timeBlocks, setTimeBlocks] = useState([
    { start: "18:00", end: "20:00" },
  ]);
  const [partyMin, setPartyMin] = useState("2");
  const [partyMax, setPartyMax] = useState("4");
  const [leadMin, setLeadMin] = useState("30");
  const [leadMax, setLeadMax] = useState("240");
  const [benefitId, setBenefitId] = useState("1");
  const [benefitType, setBenefitType] = useState<BenefitType>(
    BenefitType.FREE_MENU_ITEM
  );
  const [benefitValue, setBenefitValue] = useState("");
  const [dailyCap, setDailyCap] = useState("20");
  const [minSpend, setMinSpend] = useState("30000");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [catalog, setCatalog] = useState<BenefitItem[]>(mockBenefits);

  useEffect(() => {
    if (benefitRows.length > 0) {
      setCatalog(
        benefitRows.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
        }))
      );
    } else {
      setCatalog(mockBenefits);
    }

    async function loadRule() {
      if (ruleId) {
        const localTarget = ruleRows.find((item) => String(item.id) === String(ruleId));
        if (localTarget) {
          setName(localTarget.name ?? "");
          setDays(localTarget.days ?? days);
          setTimeBlocks(localTarget.time_blocks ?? timeBlocks);
          setPartyMin(String(localTarget.party_min ?? partyMin));
          setPartyMax(String(localTarget.party_max ?? partyMax));
          setLeadMin(String(localTarget.lead_min ?? leadMin));
          setLeadMax(String(localTarget.lead_max ?? leadMax));
          setBenefitId(String(localTarget.benefit_id ?? benefitId));
          setBenefitType((localTarget.benefit_type ?? benefitType) as BenefitType);
          setBenefitValue(String(localTarget.benefit_value ?? benefitValue));
          const guardrails = localTarget.guardrails ?? {};
          setDailyCap(String(guardrails.daily_cap ?? dailyCap));
          setMinSpend(String(guardrails.min_spend ?? minSpend));
          setVisibility((localTarget.visibility as "public" | "private") ?? "public");
          setRecurrenceDays(
            localTarget.recurrence_days && localTarget.recurrence_days.length > 0
              ? localTarget.recurrence_days
              : (localTarget.days ?? days)
                  .map((enabled, idx) => (enabled ? dayCodes[idx] : null))
                  .filter(Boolean) as string[]
          );
          setActiveTimeStart(
            localTarget.active_time_start ?? timeBlocks[0]?.start ?? "18:00"
          );
          setActiveTimeEnd(
            localTarget.active_time_end ?? timeBlocks[0]?.end ?? "20:00"
          );
          setIsAutoApply(Boolean(localTarget.is_auto_apply));
          return;
        }
      }

      if (ruleId) {
        setName(mockRule.name);
        setDays(mockRule.days);
        setTimeBlocks(mockRule.timeBlocks);
        setPartyMin(mockRule.partyMin);
        setPartyMax(mockRule.partyMax);
        setLeadMin(mockRule.leadMin);
        setLeadMax(mockRule.leadMax);
        setBenefitId(mockRule.benefitId);
        setBenefitType(mockRule.benefitType);
        setBenefitValue(mockRule.benefitValue);
        setDailyCap(mockRule.dailyCap);
        setMinSpend(mockRule.minSpend);
        setVisibility(mockRule.visibility as "public" | "private");
        setRecurrenceDays(
          mockRule.days
            .map((enabled, idx) => (enabled ? dayCodes[idx] : null))
            .filter(Boolean) as string[]
        );
        setActiveTimeStart(mockRule.timeBlocks[0]?.start ?? "18:00");
        setActiveTimeEnd(mockRule.timeBlocks[0]?.end ?? "20:00");
        setIsAutoApply(false);
      }
      return;
    }

    void loadRule();
  }, [storeIdValue, ruleId, benefitRows, ruleRows]);

  useEffect(() => {
    if (!catalog.length) return;
    const exists = catalog.some((item) => String(item.id) === String(benefitId));
    if (!exists) {
      setBenefitId(String(catalog[0].id));
    }
  }, [catalog, benefitId]);

  const summary = useMemo(() => {
    const benefit = catalog.find((item) => String(item.id) === benefitId);
    return {
      name,
      days: days
        .map((enabled, index) => (enabled ? dayLabels[index] : null))
        .filter(Boolean)
        .join(", "),
      timeBlocks: timeBlocks
        .map((block) => `${block.start}~${block.end}`)
        .join(", "),
      partySize: `${partyMin}~${partyMax}`,
      leadTime: `${leadMin}~${leadMax} \uBD84`,
      benefit: benefit ? benefit.title : benefitTypeLabelMap[benefitType],
      benefitValue,
      guardrails: `\uD558\uB8E8 \uC120\uCC29\uC21C ${dailyCap}\uD300, \uCD5C\uC18C \uACB0\uC81C \uAE08\uC561 ${minSpend}\uC6D0`,
      visibility,
      benefitType: benefit?.type ?? benefitType,
    };
  }, [
    name,
    days,
    timeBlocks,
    partyMin,
    partyMax,
    leadMin,
    leadMax,
    benefitId,
    benefitType,
    benefitValue,
    dailyCap,
    minSpend,
    catalog,
    visibility,
  ]);

  async function handleSave() {
    const payload = {
      name,
      days,
      timeBlocks,
      partySize: { min: Number(partyMin), max: Number(partyMax) },
      leadTime: { min: Number(leadMin), max: Number(leadMax) },
      benefitId,
      benefitType,
      benefitValue,
      guardrails: { dailyCap: Number(dailyCap), minSpend: Number(minSpend) },
      visibility,
      is_private: visibility === "private",
    };

    const placeId = Number(storeIdValue);
    const ruleRow = {
      id: ruleId ?? crypto.randomUUID(),
      place_id: Number.isFinite(placeId) ? placeId : undefined,
      name,
      enabled: true,
      days,
      recurrence_days: recurrenceDays,
      active_time_start: activeTimeStart,
      active_time_end: activeTimeEnd,
      is_auto_apply: isAutoApply,
      time_blocks: timeBlocks,
      party_min: Number(partyMin),
      party_max: Number(partyMax),
      lead_min: Number(leadMin),
      lead_max: Number(leadMax),
      benefit_id: benefitId,
      benefit_title: summary.benefit,
      benefit_type: String(benefitType),
      benefit_value: benefitValue,
      guardrails: { daily_cap: Number(dailyCap), min_spend: Number(minSpend) },
      visibility,
    };

    try {
      if (ruleId) {
        const { id, ...payload } = ruleRow;
        await updateRule.mutateAsync({ id: String(id), ...payload });
      } else {
        await createRule.mutateAsync(ruleRow);
      }
      window.alert("\uC131\uACF5\uC801\uC73C\uB85C \uC800\uC7A5\uB418\uC5C8\uC2B5\uB2C8\uB2E4!");
      router.push(`/stores/${storeIdValue}/offers/rules`);
    } catch (error) {
      console.error(error);
      window.alert("\uC11C\uBC84 \uC800\uC7A5\uC744 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.");
    }
  }

  const previewMessage = buildBenefitMessage(
    summary.benefitType as BenefitType,
    summary.benefitValue
  );

  const presetSetters: PresetSetters = {
    setName,
    setBenefitType,
    setBenefitValue,
    setPartyMin,
    setPartyMax,
    setLeadMin,
    setLeadMax,
    setTimeBlocks,
    setMinSpend,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{"\uB8F0 \uBE4C\uB354"}</h1>
          <p className="text-sm text-slate-500">
            {"\uC870\uAC74 / \uD61C\uD0DD / \uC0C1\uC138 \uC870\uAC74 \uC124\uC815 / \uBBF8\uB9AC\uBCF4\uAE30"}
          </p>
        </div>
        <Button onClick={handleSave}>{"\uC800\uC7A5"}</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">{`\uB2E8\uACC4 ${step}`}</div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-sm font-medium">{"\u26A1 \uC790\uC8FC \uC4F0\uB294 \uADDC\uCE59 \uBD88\uB7EC\uC624\uAE30"}</div>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.key}
                    variant="secondary"
                    className="rounded-full"
                    onClick={() => preset.apply(presetSetters)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uADDC\uCE59 \uC774\uB984"}</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="\uD3C9\uC77C \uC800\uB141 4\uC778 \uB8F0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uC694\uC77C"}</label>
              <div className="flex flex-wrap gap-2">
                {dayLabels.map((label, index) => (
                  <label key={label} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={days[index]}
                      onChange={() =>
                        setDays((prev) =>
                          prev.map((value, idx) => (idx === index ? !value : value))
                        )
                      }
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uC801\uC6A9\uD560 \uC2DC\uAC04\uB300"}</label>
              <div className="space-y-2">
                {timeBlocks.map((block, index) => (
                  <div key={`${block.start}-${index}`} className="flex gap-2">
                    <Input
                      type="time"
                      value={block.start}
                      onChange={(event) =>
                        setTimeBlocks((prev) =>
                          prev.map((item, idx) =>
                            idx === index
                              ? { ...item, start: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Input
                      type="time"
                      value={block.end}
                      onChange={(event) =>
                        setTimeBlocks((prev) =>
                          prev.map((item, idx) =>
                            idx === index
                              ? { ...item, end: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        setTimeBlocks((prev) => prev.filter((_, idx) => idx !== index))
                      }
                    >
                      {"\uC0AD\uC81C"}
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setTimeBlocks((prev) => [...prev, { start: "18:00", end: "20:00" }])
                }
              >
                {"\uC2DC\uAC04\uB300 \uCD94\uAC00"}
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uBC18\uBCF5 \uC694\uC77C \uC120\uD0DD"}</label>
              <div className="flex flex-wrap gap-2">
                {dayLabels.map((label, index) => {
                  const code = dayCodes[index];
                  const checked = recurrenceDays.includes(code);
                  return (
                    <label key={`recurrence-${label}`} className="flex items-center gap-1 text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setRecurrenceDays((prev) =>
                            checked
                              ? prev.filter((item) => item !== code)
                              : [...prev, code]
                          )
                        }
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uBC18\uBCF5 \uC801\uC6A9 \uC2DC\uAC04\uB300"}</label>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  type="time"
                  value={activeTimeStart}
                  onChange={(event) => setActiveTimeStart(event.target.value)}
                />
                <Input
                  type="time"
                  value={activeTimeEnd}
                  onChange={(event) => setActiveTimeEnd(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={isAutoApply}
                  onChange={(event) => setIsAutoApply(event.target.checked)}
                />
                {"\uC2A4\uCF00\uC904\uB7EC\uC5D0 \uC790\uB3D9 \uC801\uC6A9 \uD45C\uC2DC"}
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">{"\uC778\uC6D0 \uC81C\uD55C (\uCD5C\uC18C)"}</label>
                <Input
                  type="number"
                  value={partyMin}
                  onChange={(event) => setPartyMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{"\uC778\uC6D0 \uC81C\uD55C (\uCD5C\uB300)"}</label>
                <Input
                  type="number"
                  value={partyMax}
                  onChange={(event) => setPartyMax(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {"\uC608\uC57D \uB9C8\uAC10 (\uBC29\uBB38 N\uBD84 \uC804\uAE4C\uC9C0)"}
                </label>
                <Input
                  type="number"
                  value={leadMin}
                  onChange={(event) => setLeadMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {"\uC608\uC57D \uC624\uD508 (\uBC29\uBB38 N\uBD84 \uC804\uBD80\uD130)"}
                </label>
                <Input
                  type="number"
                  value={leadMax}
                  onChange={(event) => setLeadMax(event.target.value)}
                />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uB0B4 \uD61C\uD0DD \uBD88\uB7EC\uC624\uAE30"}</label>
              <Select
                value={benefitId}
                onChange={(event) => setBenefitId(event.target.value)}
              >
                {catalog.map((benefit) => (
                  <option key={benefit.id} value={String(benefit.id)}>
                    {benefit.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uD61C\uD0DD \uC885\uB958"}</label>
              <Select
                value={benefitType}
                onChange={(event) => setBenefitType(event.target.value as BenefitType)}
              >
                {benefitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uD61C\uD0DD \uB0B4\uC6A9"}</label>
              <Input
                value={benefitValue}
                onChange={(event) => setBenefitValue(event.target.value)}
                placeholder="\uC608: \uC804/\uB9C9\uAC78\uB9AC, 10% \uD560\uC778"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uD558\uB8E8 \uC120\uCC29\uC21C (\uD300)"}</label>
              <Input
                value={dailyCap}
                onChange={(event) => setDailyCap(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uCD5C\uC18C \uACB0\uC81C \uAE08\uC561 (\uAC1D\uB2E8\uAC00)"}</label>
              <Input
                value={minSpend}
                onChange={(event) => setMinSpend(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{"\uC0C1\uC138 \uC870\uAC74 \uC124\uC815"}</label>
              <div className="space-y-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  {"\uACF5\uAC1C"}
                  <span className="text-xs text-slate-500">
                    {"\uD56B\uB51C \uD0ED\uC5D0 \uBAA8\uB4E0 \uC0AC\uB78C\uC5D0\uAC8C \uB178\uCD9C\uD569\uB2C8\uB2E4. (\uACF5\uC2E4 \uD574\uACB0 \uCD5C\uC801)"}
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  {"\uBE44\uACF5\uAC1C \uC81C\uC548"}
                  <span className="text-xs text-slate-500">
                    {
                      "\uD56B\uB51C \uD0ED\uC5D0 \uB178\uCD9C\uD558\uC9C0 \uC54A\uACE0, AI\uAC00 \uC801\uD569\uD55C \uC190\uB2D8\uC5D0\uAC8C\uB9CC \uC81C\uC548\uD569\uB2C8\uB2E4. (\uBE0C\uB79C\uB4DC \uBCF4\uD638)"
                    }
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>{"\uBBF8\uB9AC\uBCF4\uAE30"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>{"\uC0AC\uC7A5\uB2D8, \uD559\uC0DD\uB4E4\uC5D0\uAC8C\uB294 \uC774\uB807\uAC8C \uBCF4\uC785\uB2C8\uB2E4."}</div>
              <HotDealCard
                title={summary.name || "-"}
                benefit={previewMessage}
                timer="\uB9C8\uAC10\uAE4C\uC9C0 02:15"
                visibility={summary.visibility}
                storeName={storeName}
                category={storeCategory}
              />
              <div>{"\uC694\uC77C: "}{summary.days || "-"}</div>
              <div>{"\uC2DC\uAC04\uB300: "}{summary.timeBlocks || "-"}</div>
              <div>{"\uC778\uC6D0 \uC81C\uD55C: "}{summary.partySize}</div>
              <div>{"\uC608\uC57D \uB9C8\uAC10/\uC624\uD508: "}{summary.leadTime}</div>
              <div>{"\uC0C1\uC138 \uC870\uAC74 \uC124\uC815: "}{summary.guardrails}</div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1}
          >
            {"\uC774\uC804"}
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep((prev) => prev + 1)}>
              {"\uB2E4\uC74C"}
            </Button>
          ) : (
            <Button onClick={handleSave}>{"\uC644\uB8CC"}</Button>
          )}
        </div>
      </div>
    </div>
  );
}
