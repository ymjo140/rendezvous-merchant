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
import { loadBenefits, saveBenefits } from "@/lib/utils/benefitsStore";

type Benefit = {
  id: number | string;
  title: string;
  category: BenefitCategory;
  type: BenefitType;
  value?: string;
  active: boolean;
};

const categoryOptions = [
  { value: BenefitCategory.GOODS, label: "메뉴·물품 제공" },
  { value: BenefitCategory.EXPERIENCE, label: "공간·경험 혜택" },
  { value: BenefitCategory.TIME, label: "시간 서비스" },
  { value: BenefitCategory.FINANCIAL, label: "금액 할인" },
];

const categoryLabelMap: Record<BenefitCategory, string> = {
  [BenefitCategory.FINANCIAL]: "금액 할인",
  [BenefitCategory.GOODS]: "메뉴·물품 제공",
  [BenefitCategory.TIME]: "시간 서비스",
  [BenefitCategory.EXPERIENCE]: "공간·경험 혜택",
};

const typeOptionsByCategory: Record<
  BenefitCategory,
  Array<{
    value: BenefitType;
    label: string;
    inputType: "number" | "text";
    placeholder: string;
    unitLabel: string;
  }>
> = {
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
      placeholder: "감자튀김",
      unitLabel: "",
    },
    {
      value: BenefitType.SIZE_UPGRADE,
      label: "사이즈업",
      inputType: "text",
      placeholder: "큰 사이즈",
      unitLabel: "",
    },
    {
      value: BenefitType.UNLIMITED_REFILL,
      label: "무제한 리필",
      inputType: "text",
      placeholder: "무제한 리필",
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
      placeholder: "빔프로젝터",
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

const benefitFormSchema = z
  .object({
    category: z.nativeEnum(BenefitCategory),
    type: z.nativeEnum(BenefitType),
    title: z.string().min(1, "혜택 이름을 입력해 주세요."),
    value: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const rawValue = (data.value ?? "").trim();
    const numberValue = Number(rawValue);
    const isNumber = rawValue !== "" && !Number.isNaN(numberValue);

    const addIssue = (message: string) => {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: ["value"],
      });
    };

    switch (data.type) {
      case BenefitType.PERCENT_DISCOUNT:
        if (!isNumber || numberValue < 1 || numberValue > 100) {
          addIssue("1~100 사이 숫자로 입력해 주세요.");
        }
        break;
      case BenefitType.FIXED_AMOUNT_OFF:
        if (!isNumber || numberValue <= 0) {
          addIssue("금액을 숫자로 입력해 주세요.");
        }
        break;
      case BenefitType.TIME_EXTENSION:
      case BenefitType.EARLY_ACCESS:
      case BenefitType.LATE_CHECKOUT:
        if (!isNumber || numberValue <= 0) {
          addIssue("분 단위 숫자로 입력해 주세요.");
        }
        break;
      case BenefitType.FREE_MENU_ITEM:
      case BenefitType.SIZE_UPGRADE:
      case BenefitType.UNLIMITED_REFILL:
      case BenefitType.SPACE_UPGRADE:
      case BenefitType.FREE_EQUIPMENT:
      case BenefitType.CORKAGE_FREE:
        if (!rawValue) {
          addIssue("혜택 내용을 입력해 주세요.");
        }
        break;
      default:
        break;
    }
  });

type BenefitFormValues = z.infer<typeof benefitFormSchema>;

const fallbackBenefits: Benefit[] = [
  {
    id: 1,
    title: "음료 1잔",
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
    value: "10",
    active: true,
  },
];

export function BenefitsCatalogPage({ storeId }: { storeId?: string }) {
  const [benefits, setBenefits] = useState<Benefit[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BenefitFormValues>({
    resolver: zodResolver(benefitFormSchema),
    defaultValues: {
      category: BenefitCategory.GOODS,
      type: BenefitType.FREE_MENU_ITEM,
      title: "",
      value: "",
    },
  });

  const selectedCategory = watch("category");
  const selectedType = watch("type");

  const typeOptions = useMemo(
    () => typeOptionsByCategory[selectedCategory] ?? [],
    [selectedCategory]
  );

  const activeTypeConfig = useMemo(() => {
    return (
      typeOptions.find((item) => item.value === selectedType) ??
      typeOptions[0]
    );
  }, [typeOptions, selectedType]);

  useEffect(() => {
    if (!typeOptions.some((item) => item.value === selectedType) && typeOptions[0]) {
      setValue("type", typeOptions[0].value, { shouldValidate: true });
    }
  }, [typeOptions, selectedType, setValue]);

  useEffect(() => {
    const local = loadBenefits(storeId);
    if (local && local.length > 0) {
      setBenefits(local);
    } else {
      setBenefits(fallbackBenefits);
    }
  }, [storeId]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!storeId || !baseURL) return;
      try {
        const data = await fetchWithAuth<Benefit[]>(endpoints.benefits(storeId));
        if (active && Array.isArray(data)) {
          setBenefits(data);
          saveBenefits(storeId, data);
        }
      } catch {
        // keep local fallback
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [storeId]);

  async function onSubmit(values: BenefitFormValues) {
    const nextBenefit: Benefit = {
      id: Date.now(),
      title: values.title,
      category: values.category,
      type: values.type,
      value: values.value,
      active: true,
    };

    if (!storeId || !baseURL) {
      setBenefits((prev) => {
        const next = [nextBenefit, ...prev];
        saveBenefits(storeId, next);
        return next;
      });
      reset({
        category: values.category,
        type: values.type,
        title: "",
        value: "",
      });
      return;
    }

    try {
      await fetchWithAuth(endpoints.benefits(storeId), {
        method: "POST",
        body: JSON.stringify(nextBenefit),
      });
      setBenefits((prev) => {
        const next = [nextBenefit, ...prev];
        saveBenefits(storeId, next);
        return next;
      });
      reset({
        category: values.category,
        type: values.type,
        title: "",
        value: "",
      });
    } catch {
      setBenefits((prev) => {
        const next = [nextBenefit, ...prev];
        saveBenefits(storeId, next);
        return next;
      });
      reset({
        category: values.category,
        type: values.type,
        title: "",
        value: "",
      });
    }
  }

  async function handleDelete(targetId: Benefit["id"]) {
    if (!window.confirm("이 혜택을 삭제할까요?")) return;

    const prev = benefits;
    setBenefits((current) => {
      const next = current.filter((item) => item.id !== targetId);
      saveBenefits(storeId, next);
      return next;
    });

    if (!storeId || !baseURL) return;

    try {
      await fetchWithAuth(endpoints.benefits(storeId), {
        method: "DELETE",
        body: JSON.stringify({ id: targetId }),
      });
    } catch {
      setBenefits(prev);
      saveBenefits(storeId, prev);
      window.alert("삭제에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">혜택 카탈로그</h1>
        <p className="text-sm text-slate-500">
          혜택 유형을 선택하고 간단히 등록하세요. 서비스 제공형 혜택을 우선 추천합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">카테고리 선택</label>
            <Select {...register("category")}>
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.category && (
              <p className="text-xs text-rose-500">{errors.category.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">상세 타입 선택</label>
            <Select {...register("type")}>
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {errors.type && (
              <p className="text-xs text-rose-500">{errors.type.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">혜택 이름</label>
          <Input
            placeholder="예: 음료 1잔, 룸 업그레이드"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-rose-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">혜택 내용</label>
          <div className="flex items-center gap-2">
            <Input
              type={activeTypeConfig?.inputType ?? "text"}
              placeholder={activeTypeConfig?.placeholder ?? ""}
              {...register("value")}
            />
            {activeTypeConfig?.unitLabel ? (
              <span className="text-sm text-slate-500">
                {activeTypeConfig.unitLabel}
              </span>
            ) : null}
          </div>
          {errors.value && (
            <p className="text-xs text-rose-500">{errors.value.message}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            혜택 추가
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {benefits.map((benefit) => (
          <div
            key={benefit.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4"
          >
            <div className="space-y-1">
              <div className="text-sm font-medium">{benefit.title}</div>
              <div className="text-xs text-slate-500">
                {benefit.value ? `내용: ${benefit.value}` : "내용 없음"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>{categoryLabelMap[benefit.category]}</Badge>
                <Badge>{typeLabelMap[benefit.type]}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={
                  benefit.active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }
              >
                {benefit.active ? "사용 중" : "비활성"}
              </Badge>
              <Button
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => handleDelete(benefit.id)}
              >
                삭제
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
