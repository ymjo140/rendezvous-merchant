"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function RuleBuilderPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Rule Builder</h1>
        <p className="text-sm text-slate-500">조건 → 혜택 → 가드레일 → 미리보기</p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="text-sm font-medium">Step {step}</div>
        {step === 1 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">규칙 이름</label>
            <Input placeholder="월-목 저녁 4인" />
            <label className="text-sm font-medium">요일 마스크</label>
            <Select>
              <option>월-목</option>
              <option>금-일</option>
            </Select>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">혜택 유형</label>
            <Select>
              <option>percentage_discount</option>
              <option>fixed_discount</option>
              <option>free_item</option>
            </Select>
            <label className="text-sm font-medium">혜택 값</label>
            <Input placeholder="10%" />
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">가드레일</label>
            <Input placeholder="일 최대 20건" />
          </div>
        )}
        {step === 4 && (
          <div className="text-sm text-slate-600">
            요약 정보가 여기에 표시됩니다.
          </div>
        )}
        <div className="flex justify-between">
          <Button
            variant="secondary"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          >
            이전
          </Button>
          <Button
            onClick={() => setStep((prev) => Math.min(4, prev + 1))}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}


