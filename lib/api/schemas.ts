import { z } from "zod";
import { BenefitCategory, BenefitType } from "@/domain/offers/types";

export type ApiResponse<T> = {
  data: T;
};

export const benefitSchema = z.object({
  id: z.union([z.number(), z.string()]),
  title: z.string().min(1),
  category: z.nativeEnum(BenefitCategory),
  type: z.nativeEnum(BenefitType),
  value: z.string().optional(),
  active: z.boolean(),
});

export const benefitListSchema = z.array(benefitSchema);

export const benefitInputSchema = benefitSchema.omit({ id: true });
