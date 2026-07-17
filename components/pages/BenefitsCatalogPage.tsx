"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BenefitCategory, BenefitType } from "@/domain/offers/types";
import { useBenefits, type BenefitRow } from "@/lib/hooks/useBenefits";
import { useStoreId } from "@/components/layout/Layout";

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
      placeholder: "라지 사이즈",
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
      placeholder: "블루투스 스피커",
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
          addIssue("금액은 숫자로 입력해 주세요.");
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

const fallbackBenefits: BenefitRow[] = [
  {
    id: "benefit-1",
    store_id: "dev-store",
    title: "음료 1잔",
    category: BenefitCategory.GOODS,
    type: BenefitType.FREE_MENU_ITEM,
    value: "아메리카노",
    is_active: true,
  },
  {
    id: "benefit-2",
    store_id: "dev-store",
    title: "좌석 업그레이드",
    category: BenefitCategory.EXPERIENCE,
    type: BenefitType.SPACE_UPGRADE,
    value: "창가 좌석",
    is_active: true,
  },
];

export function BenefitsCatalogPage({ storeId }: { storeId?: string }) {
  const contextStoreId = useStoreId();
  const resolvedStoreId = useMemo(() => {
    if (storeId && storeId !== "undefined" && storeId !== "null") return storeId;
    if (contextStoreId) return contextStoreId;
    return undefined;
  }, [storeId, contextStoreId]);

  if (!resolvedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"가게 정보를 불러올 수 없습니다. 매장을 선택해 주세요."}
      </div>
    );
  }

  const storeIdValue = resolvedStoreId;

  const {
    data: benefitRows = [],
    createBenefit,
    deleteBenefit,
    isSupabaseConfigured,
  } = useBenefits(resolvedStoreId);

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
    if (isSupabaseConfigured) return;
    if (benefitRows.length > 0) return;
    if (!storeIdValue) return;
    fallbackBenefits.forEach((benefit) => {
      createBenefit.mutate({ ...benefit, store_id: storeIdValue });
    });
  }, [isSupabaseConfigured, benefitRows.length, storeIdValue, createBenefit]);

  async function onSubmit(values: BenefitFormValues) {
    const newBenefit: BenefitRow = {
      id: crypto.randomUUID(),
      store_id: storeIdValue,
      title: values.title,
      category: values.category,
      type: values.type,
      value: values.value,
      is_active: true,
    };

    createBenefit.mutate(newBenefit);
    reset({
      category: values.category,
      type: values.type,
      title: "",
      value: "",
    });
  }

  function handleDelete(targetId: BenefitRow["id"]) {
    if (!window.confirm("혜택을 삭제할까요?")) return;
    deleteBenefit.mutate({ id: String(targetId) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"혜택 카탈로그"}</h1>
        <p className="text-sm text-slate-500">
          {
            "혜택 유형을 선택하고 간단히 등록하세요. 서비스 제공형 혜택을 우선 추천합니다."
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{"카테고리 선택"}</label>
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
            <label className="text-sm font-medium">{"상세 타입 선택"}</label>
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
          <label className="text-sm font-medium">{"혜택 이름"}</label>
          <Input
            placeholder="예: 음료 1잔, 룸 업그레이드"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-rose-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{"혜택 내용"}</label>
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
            {"혜택 추가"}
          </Button>
        </div>
      </form>

      <div className="space-y-3">
        {benefitRows.map((benefit) => (
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
                  benefit.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }
              >
                {benefit.is_active ? "사용 중" : "비활성"}
              </Badge>
              <Button
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => handleDelete(benefit.id)}
              >
                {"삭제"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
