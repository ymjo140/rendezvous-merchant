"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const dayLabels = ["월", "화", "수", "목", "금", "토", "일"];
const benefitTypes = [
  { value: "percentage_discount", label: "% 할인" },
  { value: "fixed_discount", label: "정액 할인" },
  { value: "free_item", label: "무료 메뉴" },
  { value: "set_menu", label: "세트 메뉴" },
  { value: "other", label: "기타" },
];

const mockBenefits = [
  { id: "1", title: "10% 할인", type: "percentage_discount" },
  { id: "2", title: "음료 1잔", type: "free_item" },
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
      timeBlocks: timeBlocks.map((block) => ${block.start}~).join(", "),
      partySize: ${partyMin}~,
      leadTime: ${leadMin}~분,
      benefit: benefit ? benefit.title : benefitType,
      benefitValue,
      guardrails: 일 cap , 최소 결제 ,
    };
  }, [name, days, timeBlocks, partyMin, partyMax, leadMin, leadMax, benefitId, benefitType, benefitValue, dailyCap, minSpend]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rule Builder</h1>
        <p className="text-sm text-slate-500">조건 → 혜택 → 가드레일 → 미리보기</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">Step {step}</div>
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">규칙 이름</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="월-목 저녁 4인" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">요일 선택</label>
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
              <label className="text-sm font-medium">시간 블록</label>
              <div className="space-y-2">
                {timeBlocks.map((block, index) => (
                  <div key={${block.start}-} className="flex gap-2">
                    <Input
                      type="time"
                      value={block.start}
                      onChange={(event) =>
                        setTimeBlocks((prev) =>
                          prev.map((item, idx) =>
                            idx === index ? { ...item, start: event.target.value } : item
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
                            idx === index ? { ...item, end: event.target.value } : item
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
                      제거
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
                시간 블록 추가
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">인원 최소</label>
                <Input type="number" value={partyMin} onChange={(event) => setPartyMin(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">인원 최대</label>
                <Input type="number" value={partyMax} onChange={(event) => setPartyMax(event.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">리드타임 최소(분)</label>
                <Input type="number" value={leadMin} onChange={(event) => setLeadMin(event.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">리드타임 최대(분)</label>
                <Input type="number" value={leadMax} onChange={(event) => setLeadMax(event.target.value)} />
              </div>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">혜택 선택(카탈로그)</label>
              <Select value={benefitId} onChange={(event) => setBenefitId(event.target.value)}>
                {mockBenefits.map((benefit) => (
                  <option key={benefit.id} value={benefit.id}>
                    {benefit.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">혜택 유형(직접 설정)</label>
              <Select value={benefitType} onChange={(event) => setBenefitType(event.target.value)}>
                {benefitTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">혜택 값</label>
              <Input
                value={benefitValue}
                onChange={(event) => setBenefitValue(event.target.value)}
                placeholder="10% 또는 5000원"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">일일 노출 제한</label>
              <Input value={dailyCap} onChange={(event) => setDailyCap(event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">최소 결제 금액</label>
              <Input value={minSpend} onChange={(event) => setMinSpend(event.target.value)} />
            </div>
          </div>
        )}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>미리보기</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-2">
              <div>규칙명: {summary.name || "-"}</div>
              <div>요일: {summary.days || "-"}</div>
              <div>시간: {summary.timeBlocks || "-"}</div>
              <div>인원: {summary.partySize}</div>
              <div>리드타임: {summary.leadTime}</div>
              <div>혜택: {summary.benefit} ({summary.benefitValue || "값 없음"})</div>
              <div>가드레일: {summary.guardrails}</div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          >
            이전
          </Button>
          <Button onClick={() => setStep((prev) => Math.min(4, prev + 1))}>
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}