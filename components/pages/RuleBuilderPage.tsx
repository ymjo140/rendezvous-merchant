"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { HotDealCard } from "@/components/offers/HotDealCard";

type BenefitItem = {
  id: string | number;
  title: string;
  type?: string;
};

type RuleResponse = {
  id?: string | number;
  name?: string;
  days?: boolean[];
  timeBlocks?: Array<{ start: string; end: string }>;
  partySize?: { min?: number; max?: number };
  leadTime?: { min?: number; max?: number };
  benefit?: { id?: string | number; type?: string };
  benefitValue?: string;
  guardrails?: { dailyCap?: number; minSpend?: number };
  visibility?: "public" | "private";
};

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const benefitTypes = [
  { value: "free_item", label: "Free Item" },
  { value: "service", label: "Service" },
  { value: "set_menu", label: "Set Menu" },
  { value: "percentage_discount", label: "Percent" },
  { value: "fixed_discount", label: "Fixed" },
  { value: "other", label: "Other" },
];

const mockBenefits: BenefitItem[] = [
  { id: "1", title: "Free drink", type: "free_item" },
  { id: "2", title: "Seat upgrade", type: "service" },
];

const mockRule = {
  name: "Weekday dinner for 4",
  days: [true, true, true, true, false, false, false],
  timeBlocks: [{ start: "18:00", end: "20:00" }],
  partyMin: "4",
  partyMax: "6",
  leadMin: "30",
  leadMax: "240",
  benefitId: "1",
  benefitType: "free_item",
  benefitValue: "Free drink",
  dailyCap: "20",
  minSpend: "30000",
  visibility: "public",
};

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
  const [benefitType, setBenefitType] = useState("free_item");
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
          setBenefitType(String(target.benefit?.type ?? benefitType));
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
      leadTime: `${leadMin}~${leadMax} min`,
      benefit: benefit ? benefit.title : benefitType,
      benefitValue,
      guardrails: `Daily cap ${dailyCap}, min spend ${minSpend}`,
      visibility,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Rule Builder</h1>
          <p className="text-sm text-slate-500">Conditions to Benefit to Guardrails to Preview</p>
        </div>
        <Button onClick={handleSave}>Save</Button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">Step {step}</div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Rule name</label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Weekday dinner for 4"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Days</label>
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
              <label className="text-sm font-medium">Time blocks</label>
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
                      Remove
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
                Add time block
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Party min</label>
                <Input
                  type="number"
                  value={partyMin}
                  onChange={(event) => setPartyMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Party max</label>
                <Input
                  type="number"
                  value={partyMax}
                  onChange={(event) => setPartyMax(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead time min (min)</label>
                <Input
                  type="number"
                  value={leadMin}
                  onChange={(event) => setLeadMin(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead time max (min)</label>
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
              <label className="text-sm font-medium">Catalog benefit</label>
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
              <label className="text-sm font-medium">Benefit type</label>
              <Select
                value={benefitType}
                onChange={(event) => setBenefitType(event.target.value)}
              >
                {benefitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Benefit value</label>
              <Input
                value={benefitValue}
                onChange={(event) => setBenefitValue(event.target.value)}
                placeholder="10% or 5000"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Daily cap</label>
              <Input
                value={dailyCap}
                onChange={(event) => setDailyCap(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min spend</label>
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
                  \uACF5\uAC1C (Public)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                  />
                  \uBE44\uACF5\uAC1C \uC81C\uC548 (Private)
                  <span className="text-xs text-slate-500">
                    \uB2E8\uACE8\uC774\uB098 \uC870\uAC74\uC774 \uB9DE\uB294 \uC190\uB2D8\uC5D0\uAC8C\uB9CC \uC740\uBC00\uD558\uAC8C \uC81C\uC548\uD569\uB2C8\uB2E4.
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <div>\uC0AC\uC7A5\uB2D8, \uD559\uC0DD\uB4E4\uC5D0\uAC8C\uB294 \uC774\uB807\uAC8C \uBCF4\uC785\uB2C8\uB2E4.</div>
              <HotDealCard
                title={summary.name || "-"}
                benefit={summary.benefitValue ? summary.benefitValue : summary.benefit}
                timer="Ends in 02:15"
                visibility={summary.visibility}
              />
              <div>Days: {summary.days || "-"}</div>
              <div>Time: {summary.timeBlocks || "-"}</div>
              <div>Party: {summary.partySize}</div>
              <div>Lead time: {summary.leadTime}</div>
              <div>Guardrails: {summary.guardrails}</div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          >
            Prev
          </Button>
          <Button onClick={() => setStep((prev) => Math.min(4, prev + 1))}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
