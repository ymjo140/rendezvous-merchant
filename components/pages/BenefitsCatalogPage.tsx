"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { BenefitCategory, BenefitType } from "@/domain/offers/types";

type Benefit = {
  id: number | string;
  title: string;
  category: BenefitCategory;
  type: BenefitType;
  value?: string;
  active: boolean;
};

const categoryOptions = [
  { value: BenefitCategory.FINANCIAL, label: "금액 할인" },
  { value: BenefitCategory.GOODS, label: "메뉴·물품 제공" },
  { value: BenefitCategory.TIME, label: "시간 서비스" },
  { value: BenefitCategory.EXPERIENCE, label: "공간·경험 혜택" },
];

const categoryLabelMap: Record<BenefitCategory, string> = {
  [BenefitCategory.FINANCIAL]: "금액 할인",
  [BenefitCategory.GOODS]: "메뉴·물품 제공",
  [BenefitCategory.TIME]: "시간 서비스",
  [BenefitCategory.EXPERIENCE]: "공간·경험 혜택",
};

const typeOptionsByCategory: Record<BenefitCategory, Array<{ value: BenefitType; label: string; inputType: "number" | "text"; placeholder: string; unitLabel: string }>> = {
  [BenefitCategory.FINANCIAL]: [
    {
      value: BenefitType.PERCENT_DISCOUNT,
      label: "정률 할인",
      inputType: "number",
      placeholder: "10",
      unitLabel: "%",
    },
    {
      value: BenefitType.FIXED_AMOUNT_OFF,
      label: "정액 할인",
      inputType: "number",
      placeholder: "5000",
      unitLabel: "원",
    },
  ],
  [BenefitCategory.GOODS]: [
    {
      value: BenefitType.FREE_MENU_ITEM,
      label: "메뉴 증정",
      inputType: "text",
      placeholder: "감자틐김",
      unitLabel: "",
    },
    {
      value: BenefitType.SIZE_UPGRADE,
      label: "사이즈업",
      inputType: "text",
      placeholder: "대형 사이즈",
      unitLabel: "",
    },
    {
      value: BenefitType.UNLIMITED_REFILL,
      label: "리필",
      inputType: "text",
      placeholder: "무제한",
      unitLabel: "",
    },
  ],
  [BenefitCategory.TIME]: [
    {
      value: BenefitType.TIME_EXTENSION,
      label: "시간 연장",
      inputType: "number",
      placeholder: "30",
      unitLabel: "분",
    },
    {
      value: BenefitType.EARLY_ACCESS,
      label: "얼리 체크인",
      inputType: "number",
      placeholder: "15",
      unitLabel: "분",
    },
    {
      value: BenefitType.LATE_CHECKOUT,
      label: "레이트 체크아웃",
      inputType: "number",
      placeholder: "20",
      unitLabel: "분",
    },
  ],
  [BenefitCategory.EXPERIENCE]: [
    {
      value: BenefitType.SPACE_UPGRADE,
      label: "룸/좌석 업그레이드",
      inputType: "text",
      placeholder: "4인실 → 6인실",
      unitLabel: "",
    },
    {
      value: BenefitType.FREE_EQUIPMENT,
      label: "장비 대여",
      inputType: "text",
      placeholder: "빔프매트",
      unitLabel: "",
    },
    {
      value: BenefitType.CORKAGE_FREE,
      label: "콜키지 프리",
      inputType: "text",
      placeholder: "콜키지 프리",
      unitLabel: "",
    },
  ],
};

const typeLabelMap: Record<BenefitType, string> = Object.values(
  typeOptionsByCategory
).reduce((acc, group) => {
  group.forEach((item) => {
    acc[item.value] = item.label;
  });
  return acc;
}, {} as Record<BenefitType, string>);

const fallbackBenefits: Benefit[] = [
  {
    id: 1,
    title: "음료 증정",
    category: BenefitCategory.GOODS,
    type: BenefitType.FREE_MENU_ITEM,
    value: "아메리카노",
    active: true,
  },
  {
    id: 2,
    title: "좌석 업그레이드",
    category: BenefitCategory.EXPERIENCE,
    type: BenefitType.SPACE_UPGRADE,
    value: "창가 좌석",
    active: true,
  },
  {
    id: 3,
    title: "정률 10% 할인",
    category: BenefitCategory.FINANCIAL,
    type: BenefitType.PERCENT_DISCOUNT,
    value: "10%",
    active: true,
  },
];

const benefitFormSchema = z
  .object({
    title: z.string().min(1, "혜택 이름을 입력해주세요."),
    category: z.nativeEnum(BenefitCategory),
    type: z.nativeEnum(BenefitType),
    value: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === BenefitType.PERCENT_DISCOUNT) {
      const numberValue = Number(data.value);
      if (!Number.isFinite(numberValue) || numberValue < 1 || numberValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "1~100 사이의 숫자만 입력하세요.",
        });
      }
    }

    if (data.type === BenefitType.TIME_EXTENSION) {
      const numberValue = Number(data.value);
      if (!Number.isFinite(numberValue) || numberValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "추가 시간(분)을 입력하세요.",
        });
      }
    }

    if (data.type === BenefitType.FREE_MENU_ITEM) {
      if (!data.value || data.value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "증정할 메뉴를 입력하세요.",
        });
      }
    }
  });

type BenefitFormValues = z.infer<typeof benefitFormSchema>;

export function BenefitsCatalogPage({ storeId }: { storeId?: string }) {
  const [benefits, setBenefits] = useState<Benefit[]>(fallbackBenefits);

  const form = useForm<BenefitFormValues>({
    resolver: zodResolver(benefitFormSchema),
    defaultValues: {
      title: "",
      category: BenefitCategory.GOODS,
      type: typeOptionsByCategory[BenefitCategory.GOODS][0].value,
      value: "",
    },
  });

  const category = form.watch("category");
  const type = form.watch("type");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!storeId || !baseURL) {
        setBenefits(fallbackBenefits);
        return;
      }
      try {
        const data = await fetchWithAuth<Benefit[]>(endpoints.benefits(storeId));
        if (active && Array.isArray(data)) {
          setBenefits(data);
        }
      } catch {
        if (active) setBenefits(fallbackBenefits);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [storeId]);

  useEffect(() => {
    const options = typeOptionsByCategory[category];
    if (options.length && !options.find((item) => item.value === type)) {
      form.setValue("type", options[0].value, { shouldValidate: true });
    }
  }, [category, type, form]);

  const inputConfig = useMemo(() => {
    const options = typeOptionsByCategory[category];
    return options.find((item) => item.value === type) ?? options[0];
  }, [category, type]);

  async function handleAdd(values: BenefitFormValues) {
    const next: Benefit = {
      id: benefits.length + 1,
      title: values.title,
      category: values.category,
      type: values.type,
      value: values.value,
      active: true,
    };

    setBenefits((prev) => [...prev, next]);
    form.reset({
      title: "",
      category: values.category,
      type: values.type,
      value: "",
    });

    if (!storeId || !baseURL) return;

    try {
      await fetchWithAuth(endpoints.benefits(storeId), {
        method: "POST",
        body: JSON.stringify(next),
      });
    } catch {
      // ignore in dev
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">혜택 카탈로그</h1>
        <p className="text-sm text-slate-500">
          서비스 제공형 혜택을 우선 추천합니다.
        </p>
      </div>

      <form
        className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
        onSubmit={form.handleSubmit(handleAdd)}
      >
        <div className="text-sm font-medium">혜택 추가</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-slate-500">카테고리</label>
            <Select
              value={category}
              onChange={(event) =>
                form.setValue("category", event.target.value as BenefitCategory, {
                  shouldValidate: true,
                })
              }
            >
              {categoryOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500">상세 타입</label>
            <Select
              value={type}
              onChange={(event) =>
                form.setValue("type", event.target.value as BenefitType, {
                  shouldValidate: true,
                })
              }
            >
              {typeOptionsByCategory[category].map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <Input
              {...form.register("title")}
              placeholder="혜택 이름"
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-rose-600">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Input
              type={inputConfig.inputType}
              placeholder={inputConfig.placeholder}
              {...form.register("value")}
            />
            {form.formState.errors.value ? (
              <p className="text-xs text-rose-600">
                {form.formState.errors.value.message}
              </p>
            ) : null}
          </div>
          <div className="flex items-center text-sm text-slate-500">
            {inputConfig.unitLabel
              ? `${inputConfig.unitLabel} 단위`
              : "사용 예시를 입력하세요"}
          </div>
        </div>
        <Button type="submit">혜택 추가</Button>
      </form>

      <div className="space-y-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{benefit.title}</div>
                <div className="text-xs text-slate-500">
                  {categoryLabelMap[benefit.category]} - {typeLabelMap[benefit.type]}
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() =>
                  setBenefits((prev) =>
                    prev.map((item) =>
                      item.id === benefit.id ? { ...item, active: !item.active } : item
                    )
                  )
                }
              >
                {benefit.active ? "비활성" : "활성"}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge>혜택 값: {benefit.value || "-"}</Badge>
              <Badge>{benefit.active ? "활성" : "비활성"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
