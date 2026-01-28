"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { HotDealCard } from "@/components/offers/HotDealCard";
import { BenefitType } from "@/domain/offers/types";

const dayLabels = ["\uC6D4", "\uD654", "\uC218", "\uBAA9", "\uAE08", "\uD1A0", "\uC77C"];

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
  name: "\uD3C9\uC77C \uC800\uB141 4\uC778",
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

export function RuleBuilderPage({
  storeId,
  ruleId,
}: {
  storeId?: string;
  ruleId?: string;
}) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [days, setDays] = useState([true, true, true, true, false, false, false]);
  const [timeBlocks, setTimeBlocks] = useState([
    { start: "18:00", end: "20:00" },
  ]);
  const [partyMin, setPartyMin] = useState("2");
  const [partyMax, setPartyMax] = useState("4");
  const [leadMin, setLeadMin] = useState("30");
  const [leadMax, setLeadMax] = useState("240");
  const [benefitId, setBenefitId] = useState("1");
  const [benefitType, setBenefitType] = useState<BenefitType>(BenefitType.FREE_MENU_ITEM);
  const [benefitValue, setBenefitValue] = useState("");
  const [dailyCap, setDailyCap] = useState("20");
  const [minSpend, setMinSpend] = useState("30000");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [catalog, setCatalog] = useState<BenefitItem[]>(mockBenefits);

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      if (!storeId || !baseURL) return;
      try {
        const data = await fetchWithAuth<BenefitItem[]>(endpoints.benefits(storeId));
        if (active && Array.isArray(data)) {
          setCatalog(data);
        }
      } catch {
        // ignore
      }
    }

    async function loadRule() {
      if (!storeId || !ruleId || !baseURL) {
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
        }
        return;
      }

      try {
        const data = await fetchWithAuth<RuleResponse[] | RuleResponse>(
          endpoints.offerRules(storeId)
        );
        const target = Array.isArray(data)
          ? data.find((item) => String(item.id) === String(ruleId))
          : null;
        if (target) {
          setName(target.name ?? "");
          setDays(target.days ?? days);
          setTimeBlocks(target.timeBlocks ?? timeBlocks);
          setPartyMin(String(target.partySize?.min ?? partyMin));
          setPartyMax(String(target.partySize?.max ?? partyMax));
          setLeadMin(String(target.leadTime?.min ?? leadMin));
          setLeadMax(String(target.leadTime?.max ?? leadMax));
          setBenefitId(String(target.benefit?.id ?? benefitId));
          setBenefitType((target.benefit?.type ?? benefitType) as BenefitType);
          setBenefitValue(String(target.benefitValue ?? benefitValue));
          setDailyCap(String(target.guardrails?.dailyCap ?? dailyCap));
          setMinSpend(String(target.guardrails?.minSpend ?? minSpend));
          setVisibility((target.visibility as "public" | "private") ?? "public");
        }
      } catch {
        // ignore
      }
    }

    void loadCatalog();
    void loadRule();

    return () => {
      active = false;
    };
  }, [storeId, ruleId]);

  const summary = useMemo(() => {
    const benefit = catalog.find((item) => String(item.id) === benefitId);
    return {
      name,
      days: days
        .map((enabled, index) => (enabled ? dayLabels[index] : null))
        .filter(Boolean)
        .join(", "),
      timeBlocks: timeBlocks.map((block) => `${block.start}~${block.end}`).join(", "),
      partySize: `${partyMin}~${partyMax}`,
      leadTime: `${leadMin}~${leadMax} \uBD84`,
      benefit: benefit ? benefit.title : benefitTypeLabelMap[benefitType],
      benefitValue,
      guardrails: `\uC77C\uC77C \uB178\uCD9C \uC81C\uD55C ${dailyCap}, \uCD5C\uC18C \uACB0\uC81C \uAE08\uC561 ${minSpend}`,
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
    if (!storeId) return;

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

    if (!baseURL) return;

    try {
      await fetchWithAuth(endpoints.offerRules(storeId), {
        method: ruleId ? "PATCH" : "POST",
        body: JSON.stringify({ id: ruleId, ...payload }),
      });
    } catch {
      // ignore in dev
    }
  }

  const previewMessage = buildBenefitMessage(
    summary.benefitType as BenefitType,
    summary.benefitValue
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">\uB8F0 \uBE4C\uB354</h1>
          <p className="text-sm text-slate-500">\uC870\uAC74 / \uD61C\uD0DD / \uAC00\uB4DC\uB808\uC77C / \uBBF8\uB9AC\uBCF4\uAE30</p>
        </div>
        <Button onClick={handleSave}>\uC800\uC7A5</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">\uB2E8\uACC4 {step}</div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">\uADDC\uCE59 \uC774\uB984</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="\uD3C9\uC77C \uC800\uB141 4\uC778"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">\uC694\uC77C</label>
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
              <label className="text-sm font-medium">\uC2DC\uAC04 \uBE14\uB85D</label>
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
                      \uC0AD\uC81C
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="secondary"
                onClick={() =>
                  setTimeBlocks((prev) => [
                    ...prev,
                    { start: "18:00", end: "20:00" },
                  ])
                }
              >
                \uC2DC\uAC04 \uBE14\uB85D \uCD94\uAC00
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">\uC778\uC6D0 \uCD5C\uC18C</label>
                <Input
                  type="number"
                  value={partyMin}
                  onChange={(event) => setPartyMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">\uC778\uC6D0 \uCD5C\uB300</label>
                <Input
                  type="number"
                  value={partyMax}
                  onChange={(event) => setPartyMax(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">\uB9AC\uB4DC\uD0C0\uC784 \uCD5C\uC18C(\uBD84)</label>
                <Input
                  type="number"
                  value={leadMin}
                  onChange={(event) => setLeadMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">\uB9AC\uB4DC\uD0C0\uC784 \uCD5C\uB300(\uBD84)</label>
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
              <label className="text-sm font-medium">\uCE74\uD0C8\uB85C\uADF8 \uD61C\uD0DD</label>
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
              <label className="text-sm font-medium">\uD61C\uD0DD \uC720\uD615</label>
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
              <label className="text-sm font-medium">\uD61C\uD0DD \uAC12</label>
              <Input
                value={benefitValue}
                onChange={(event) => setBenefitValue(event.target.value)}
                placeholder="10% \uB610\uB294 5000\uC6D0"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">\uC77C\uC77C \uB178\uCD9C \uC81C\uD55C</label>
              <Input
                value={dailyCap}
                onChange={(event) => setDailyCap(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">\uCD5C\uC18C \uACB0\uC81C \uAE08\uC561</label>
              <Input
                value={minSpend}
                onChange={(event) => setMinSpend(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">\uACF5\uAC1C \uC124\uC815</label>
              <div className="space-y-2 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                  />
                  \uACF5\uAC1C
                  <span className="text-xs text-slate-500">
                    \uD56B\uB51C \uD0ED\uC5D0 \uBAA8\uB4E0 \uC0AC\uB78C\uC5D0\uAC8C \uB178\uCD9C\uD569\uB2C8\uB2E4. (\uACF5\uC2E4 \uD574\uACB0\uC5D0 \uCD5C\uC801)
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
                  \uBE44\uACF5\uAC1C \uC81C\uC548
                  <span className="text-xs text-slate-500">
                    \uD56B\uB51C \uD0ED\uC5D0 \uB178\uCD9C\uD558\uC9C0 \uC54A\uACE0, AI\uAC00 \uC801\uD569\uD55C \uC190\uB2D8\uC5D0\uAC8C\uB9CC \uC740\uBC00\uD558\uAC8C \uC81C\uC548\uD569\uB2C8\uB2E4. (\uBE0C\uB79C\uB4DC \uC774\uBBF8\uC9C0 \uBCF4\uD638)
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>\uBBF8\uB9AC\uBCF4\uAE30</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>\uC0AC\uC7A5\uB2D8, \uD559\uC0DD\uB4E4\uC5D0\uAC8C\uB294 \uC774\uB807\uAC8C \uBCF4\uC785\uB2C8\uB2E4.</div>
              <HotDealCard
                title={summary.name || "-"}
                benefit={previewMessage}
                timer="\uB9C8\uAC10\uAE4C\uC9C0 02:15"
                visibility={summary.visibility}
              />
              <div>\uC694\uC77C: {summary.days || "-"}</div>
              <div>\uC2DC\uAC04: {summary.timeBlocks || "-"}</div>
              <div>\uC778\uC6D0: {summary.partySize}</div>
              <div>\uB9AC\uB4DC\uD0C0\uC784: {summary.leadTime}</div>
              <div>\uAC00\uB4DC\uB808\uC77C: {summary.guardrails}</div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          >
            \uC774\uC804
          </Button>
          <Button onClick={() => setStep((prev) => Math.min(4, prev + 1))}>
            \uB2E4\uC74C
          </Button>
        </div>
      </div>
    </div>
  );
}
