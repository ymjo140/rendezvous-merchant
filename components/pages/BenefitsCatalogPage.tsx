"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BenefitCategory, BenefitType } from "@/domain/offers/types";
import { useBenefits, type BenefitRow } from "@/lib/hooks/useBenefits";

const categoryOptions = [
  { value: BenefitCategory.GOODS, label: "\uBA54\uB274\u00B7\uBB3C\uD488 \uC81C\uACF5" },
  { value: BenefitCategory.EXPERIENCE, label: "\uACF5\uAC04\u00B7\uACBD\uD5D8 \uD61C\uD0DD" },
  { value: BenefitCategory.TIME, label: "\uC2DC\uAC04 \uC11C\uBE44\uC2A4" },
  { value: BenefitCategory.FINANCIAL, label: "\uAE08\uC561 \uD560\uC778" },
];

const categoryLabelMap: Record<BenefitCategory, string> = {
  [BenefitCategory.FINANCIAL]: "\uAE08\uC561 \uD560\uC778",
  [BenefitCategory.GOODS]: "\uBA54\uB274\u00B7\uBB3C\uD488 \uC81C\uACF5",
  [BenefitCategory.TIME]: "\uC2DC\uAC04 \uC11C\uBE44\uC2A4",
  [BenefitCategory.EXPERIENCE]: "\uACF5\uAC04\u00B7\uACBD\uD5D8 \uD61C\uD0DD",
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
      label: "\uC815\uB960 \uD560\uC778",
      inputType: "number",
      placeholder: "10",
      unitLabel: "%",
    },
    {
      value: BenefitType.FIXED_AMOUNT_OFF,
      label: "\uC815\uC561 \uD560\uC778",
      inputType: "number",
      placeholder: "5000",
      unitLabel: "\uC6D0",
    },
  ],
  [BenefitCategory.GOODS]: [
    {
      value: BenefitType.FREE_MENU_ITEM,
      label: "\uBA54\uB274 \uC99D\uC815",
      inputType: "text",
      placeholder: "\uAC10\uC790\uD280\uAE40",
      unitLabel: "",
    },
    {
      value: BenefitType.SIZE_UPGRADE,
      label: "\uC0AC\uC774\uC988\uC5C5",
      inputType: "text",
      placeholder: "\uB77C\uC9C0 \uC0AC\uC774\uC988",
      unitLabel: "",
    },
    {
      value: BenefitType.UNLIMITED_REFILL,
      label: "\uBB34\uC81C\uD55C \uB9AC\uD544",
      inputType: "text",
      placeholder: "\uBB34\uC81C\uD55C \uB9AC\uD544",
      unitLabel: "",
    },
  ],
  [BenefitCategory.TIME]: [
    {
      value: BenefitType.TIME_EXTENSION,
      label: "\uC2DC\uAC04 \uC5F0\uC7A5",
      inputType: "number",
      placeholder: "30",
      unitLabel: "\uBD84",
    },
    {
      value: BenefitType.EARLY_ACCESS,
      label: "\uC5BC\uB9AC \uCCB4\uD06C\uC778",
      inputType: "number",
      placeholder: "15",
      unitLabel: "\uBD84",
    },
    {
      value: BenefitType.LATE_CHECKOUT,
      label: "\uB808\uC774\uD2B8 \uCCB4\uD06C\uC544\uC6C3",
      inputType: "number",
      placeholder: "20",
      unitLabel: "\uBD84",
    },
  ],
  [BenefitCategory.EXPERIENCE]: [
    {
      value: BenefitType.SPACE_UPGRADE,
      label: "\uB8F8/\uC88C\uC11D \uC5C5\uADF8\uB808\uC774\uB4DC",
      inputType: "text",
      placeholder: "4\uC778\uC2E4 \u2192 6\uC778\uC2E4",
      unitLabel: "",
    },
    {
      value: BenefitType.FREE_EQUIPMENT,
      label: "\uC7A5\uBE44 \uB300\uC5EC",
      inputType: "text",
      placeholder: "\uBE14\uB8E8\uD22C\uC2A4 \uC2A4\uD53C\uCEE4",
      unitLabel: "",
    },
    {
      value: BenefitType.CORKAGE_FREE,
      label: "\uCF5C\uD0A4\uC9C0 \uD504\uB9AC",
      inputType: "text",
      placeholder: "\uCF5C\uD0A4\uC9C0 \uD504\uB9AC",
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
    title: z.string().min(1, "\uD61C\uD0DD \uC774\uB984\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694."),
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
          addIssue("1~100 \uC0AC\uC774 \uC22B\uC790\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
        }
        break;
      case BenefitType.FIXED_AMOUNT_OFF:
        if (!isNumber || numberValue <= 0) {
          addIssue("\uAE08\uC561\uC740 \uC22B\uC790\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
        }
        break;
      case BenefitType.TIME_EXTENSION:
      case BenefitType.EARLY_ACCESS:
      case BenefitType.LATE_CHECKOUT:
        if (!isNumber || numberValue <= 0) {
          addIssue("\uBD84 \uB2E8\uC704 \uC22B\uC790\uB85C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
        }
        break;
      case BenefitType.FREE_MENU_ITEM:
      case BenefitType.SIZE_UPGRADE:
      case BenefitType.UNLIMITED_REFILL:
      case BenefitType.SPACE_UPGRADE:
      case BenefitType.FREE_EQUIPMENT:
      case BenefitType.CORKAGE_FREE:
        if (!rawValue) {
          addIssue("\uD61C\uD0DD \uB0B4\uC6A9\uC744 \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
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
    title: "\uC74C\uB8CC 1\uC794",
    category: BenefitCategory.GOODS,
    type: BenefitType.FREE_MENU_ITEM,
    value: "\uC544\uBA54\uB9AC\uCE74\uB178",
    is_active: true,
  },
  {
    id: "benefit-2",
    store_id: "dev-store",
    title: "\uC88C\uC11D \uC5C5\uADF8\uB808\uC774\uB4DC",
    category: BenefitCategory.EXPERIENCE,
    type: BenefitType.SPACE_UPGRADE,
    value: "\uCC3D\uAC00 \uC88C\uC11D",
    is_active: true,
  },
];

export function BenefitsCatalogPage({ storeId }: { storeId?: string }) {
  const pathname = usePathname();
  const effectiveStoreId = useMemo(() => {
    if (storeId && storeId !== "undefined" && storeId !== "null") return storeId;
    const parts = pathname?.split("/").filter(Boolean) ?? [];
    const storesIndex = parts.indexOf("stores");
    if (storesIndex >= 0 && parts[storesIndex + 1]) {
      const candidate = parts[storesIndex + 1];
      if (candidate && candidate !== "undefined" && candidate !== "null") {
        return candidate;
      }
    }
    return undefined;
  }, [storeId, pathname]);
  const [resolvedStoreId, setResolvedStoreId] = useState<string | undefined>(
    undefined
  );

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
    if (effectiveStoreId) {
      setResolvedStoreId(effectiveStoreId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("rendezvous_last_store", effectiveStoreId);
      }
      return;
    }
    if (typeof window !== "undefined") {
      const lastStore = window.localStorage.getItem("rendezvous_last_store");
      if (lastStore) {
        setResolvedStoreId(lastStore);
      }
    }
  }, [effectiveStoreId]);

  useEffect(() => {
    if (isSupabaseConfigured) return;
    if (benefitRows.length > 0) return;
    if (!resolvedStoreId) return;
    fallbackBenefits.forEach((benefit) => {
      createBenefit.mutate({ ...benefit, store_id: resolvedStoreId });
    });
  }, [isSupabaseConfigured, benefitRows.length, resolvedStoreId, createBenefit]);

  async function onSubmit(values: BenefitFormValues) {
    const newBenefit: BenefitRow = {
      id: crypto.randomUUID(),
      store_id: resolvedStoreId ?? "dev-store",
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
    if (!window.confirm("\uD61C\uD0DD\uC744 \uC0AD\uC81C\uD560\uAE4C\uC694?")) return;
    deleteBenefit.mutate({ id: String(targetId) });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"\uD61C\uD0DD \uCE74\uD0C8\uB85C\uADF8"}</h1>
        <p className="text-sm text-slate-500">
          {
            "\uD61C\uD0DD \uC720\uD615\uC744 \uC120\uD0DD\uD558\uACE0 \uAC04\uB2E8\uD788 \uB4F1\uB85D\uD558\uC138\uC694. \uC11C\uBE44\uC2A4 \uC81C\uACF5\uD615 \uD61C\uD0DD\uC744 \uC6B0\uC120 \uCD94\uCC9C\uD569\uB2C8\uB2E4."
          }
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{"\uCE74\uD14C\uACE0\uB9AC \uC120\uD0DD"}</label>
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
            <label className="text-sm font-medium">{"\uC0C1\uC138 \uD0C0\uC785 \uC120\uD0DD"}</label>
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
          <label className="text-sm font-medium">{"\uD61C\uD0DD \uC774\uB984"}</label>
          <Input
            placeholder="\uC608: \uC74C\uB8CC 1\uC794, \uB8F8 \uC5C5\uADF8\uB808\uC774\uB4DC"
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-rose-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{"\uD61C\uD0DD \uB0B4\uC6A9"}</label>
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
            {"\uD61C\uD0DD \uCD94\uAC00"}
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
                {benefit.value ? `\uB0B4\uC6A9: ${benefit.value}` : "\uB0B4\uC6A9 \uC5C6\uC74C"}
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
                {benefit.is_active ? "\uC0AC\uC6A9 \uC911" : "\uBE44\uD65C\uC131"}
              </Badge>
              <Button
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => handleDelete(benefit.id)}
              >
                {"\uC0AD\uC81C"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
