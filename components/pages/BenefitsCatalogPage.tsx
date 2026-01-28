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
  { value: BenefitCategory.FINANCIAL, label: "\uAE08\uC561 \uD560\uC778" },
  { value: BenefitCategory.GOODS, label: "\uBA54\uB274\u00B7\uBB3C\uD488 \uC81C\uACF5" },
  { value: BenefitCategory.TIME, label: "\uC2DC\uAC04 \uC11C\uBE44\uC2A4" },
  { value: BenefitCategory.EXPERIENCE, label: "\uACF5\uAC04\u00B7\uACBD\uD5D8 \uD61C\uD0DD" },
];

const categoryLabelMap: Record<BenefitCategory, string> = {
  [BenefitCategory.FINANCIAL]: "\uAE08\uC561 \uD560\uC778",
  [BenefitCategory.GOODS]: "\uBA54\uB274\u00B7\uBB3C\uD488 \uC81C\uACF5",
  [BenefitCategory.TIME]: "\uC2DC\uAC04 \uC11C\uBE44\uC2A4",
  [BenefitCategory.EXPERIENCE]: "\uACF5\uAC04\u00B7\uACBD\uD5D8 \uD61C\uD0DD",
};

const typeOptionsByCategory: Record<BenefitCategory, Array<{ value: BenefitType; label: string; inputType: "number" | "text"; placeholder: string; unitLabel: string }>> = {
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
      placeholder: "\uAC10\uC790\uD2D0\uAE40",
      unitLabel: "",
    },
    {
      value: BenefitType.SIZE_UPGRADE,
      label: "\uC0AC\uC774\uC988\uC5C5",
      inputType: "text",
      placeholder: "\uB300\uD615 \uC0AC\uC774\uC988",
      unitLabel: "",
    },
    {
      value: BenefitType.UNLIMITED_REFILL,
      label: "\uB9AC\uD544",
      inputType: "text",
      placeholder: "\uBB34\uC81C\uD55C",
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
      placeholder: "\uBE54\uD504\uB9E4\uD2B8",
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

const fallbackBenefits: Benefit[] = [
  {
    id: 1,
    title: "\uC74C\uB8CC \uC99D\uC815",
    category: BenefitCategory.GOODS,
    type: BenefitType.FREE_MENU_ITEM,
    value: "\uC544\uBA54\uB9AC\uCE74\uB178",
    active: true,
  },
  {
    id: 2,
    title: "\uC88C\uC11D \uC5C5\uADF8\uB808\uC774\uB4DC",
    category: BenefitCategory.EXPERIENCE,
    type: BenefitType.SPACE_UPGRADE,
    value: "\uCC3D\uAC00 \uC88C\uC11D",
    active: true,
  },
  {
    id: 3,
    title: "\uC815\uB960 10% \uD560\uC778",
    category: BenefitCategory.FINANCIAL,
    type: BenefitType.PERCENT_DISCOUNT,
    value: "10%",
    active: true,
  },
];

const benefitFormSchema = z
  .object({
    title: z.string().min(1, "\uD61C\uD0DD \uC774\uB984\uC744 \uC785\uB825\uD574\uC8FC\uC138\uC694."),
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
          message: "1~100 \uC0AC\uC774\uC758 \uC22B\uC790\uB9CC \uC785\uB825\uD558\uC138\uC694.",
        });
      }
    }

    if (data.type === BenefitType.TIME_EXTENSION) {
      const numberValue = Number(data.value);
      if (!Number.isFinite(numberValue) || numberValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "\uCD94\uAC00 \uC2DC\uAC04(\uBD84)\uC744 \uC785\uB825\uD558\uC138\uC694.",
        });
      }
    }

    if (data.type === BenefitType.FREE_MENU_ITEM) {
      if (!data.value || data.value.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["value"],
          message: "\uC99D\uC815\uD560 \uBA54\uB274\uB97C \uC785\uB825\uD558\uC138\uC694.",
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
        <h1 className="text-2xl font-semibold">\uD61C\uD0DD \uCE74\uD0C8\uB85C\uADF8</h1>
        <p className="text-sm text-slate-500">
          \uC11C\uBE44\uC2A4 \uC81C\uACF5\uD615 \uD61C\uD0DD\uC744 \uC6B0\uC120 \uCD94\uCC9C\uD569\uB2C8\uB2E4.
        </p>
      </div>

      <form
        className="rounded-lg border border-slate-200 bg-white p-4 space-y-3"
        onSubmit={form.handleSubmit(handleAdd)}
      >
        <div className="text-sm font-medium">\uD61C\uD0DD \uCD94\uAC00</div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-slate-500">\uCE74\uD14C\uACE0\uB9AC</label>
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
            <label className="text-xs text-slate-500">\uC0C1\uC138 \uD0C0\uC785</label>
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
              placeholder="\uD61C\uD0DD \uC774\uB984"
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
              ? `${inputConfig.unitLabel} \uB2E8\uC704`
              : "\uC0AC\uC6A9 \uC608\uC2DC\uB97C \uC785\uB825\uD558\uC138\uC694"}
          </div>
        </div>
        <Button type="submit">\uD61C\uD0DD \uCD94\uAC00</Button>
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
                {benefit.active ? "\uBE44\uD65C\uC131" : "\uD65C\uC131"}
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
              <Badge>\uD61C\uD0DD \uAC12: {benefit.value || "-"}</Badge>
              <Badge>{benefit.active ? "\uD65C\uC131" : "\uBE44\uD65C\uC131"}</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
