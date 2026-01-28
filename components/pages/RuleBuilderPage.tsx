"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const benefitTypes = [
  { value: "percentage_discount", label: "Percent" },
  { value: "fixed_discount", label: "Fixed" },
  { value: "free_item", label: "Free Item" },
  { value: "set_menu", label: "Set Menu" },
  { value: "other", label: "Other" },
];

const mockBenefits = [
  { id: "1", title: "10% off", type: "percentage_discount" },
  { id: "2", title: "Free drink", type: "free_item" },
];

export function RuleBuilderPage() {
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
  const [benefitType, setBenefitType] = useState("percentage_discount");
  const [benefitValue, setBenefitValue] = useState("");
  const [dailyCap, setDailyCap] = useState("20");
  const [minSpend, setMinSpend] = useState("30000");

  const summary = useMemo(() => {
    const benefit = mockBenefits.find((item) => item.id === benefitId);
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
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rule Builder</h1>
        <p className="text-sm text-slate-500">Conditions → Benefit → Guardrails → Preview</p>
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
                {mockBenefits.map((benefit) => (
                  <option key={benefit.id} value={benefit.id}>
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
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <div>Name: {summary.name || "-"}</div>
              <div>Days: {summary.days || "-"}</div>
              <div>Time: {summary.timeBlocks || "-"}</div>
              <div>Party: {summary.partySize}</div>
              <div>Lead time: {summary.leadTime}</div>
              <div>
                Benefit: {summary.benefit} ({summary.benefitValue || "none"})
              </div>
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