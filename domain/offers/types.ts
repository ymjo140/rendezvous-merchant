export enum BenefitCategory {
  FINANCIAL = "FINANCIAL",
  GOODS = "GOODS",
  TIME = "TIME",
  EXPERIENCE = "EXPERIENCE",
}

export enum BenefitType {
  // FINANCIAL
  PERCENT_DISCOUNT = "PERCENT_DISCOUNT",
  FIXED_AMOUNT_OFF = "FIXED_AMOUNT_OFF",
  // GOODS
  FREE_MENU_ITEM = "FREE_MENU_ITEM",
  SIZE_UPGRADE = "SIZE_UPGRADE",
  UNLIMITED_REFILL = "UNLIMITED_REFILL",
  // TIME
  TIME_EXTENSION = "TIME_EXTENSION",
  EARLY_ACCESS = "EARLY_ACCESS",
  LATE_CHECKOUT = "LATE_CHECKOUT",
  // EXPERIENCE
  SPACE_UPGRADE = "SPACE_UPGRADE",
  FREE_EQUIPMENT = "FREE_EQUIPMENT",
  CORKAGE_FREE = "CORKAGE_FREE",
}

export type Benefit = {
  id: number | string;
  place_id?: number | string | null;
  category: BenefitCategory;
  type: BenefitType;
  title: string;
  metadata?: Record<string, unknown>;
  is_active: boolean;
};

export type OfferRule = {
  id: number | string;
  place_id: number | string;
  name: string;
  enabled: boolean;
  day_of_week_mask: number;
  time_blocks: Array<{ start: string; end: string }>;
  party_size_min?: number | null;
  party_size_max?: number | null;
  lead_time_min_minutes?: number | null;
  lead_time_max_minutes?: number | null;
  benefit_id?: number | string | null;
  benefit_value: Record<string, unknown>;
  guardrails?: Record<string, unknown> | null;
  priority: number;
  created_at?: string;
  updated_at?: string;
};

export type Bundle = {
  id: number | string;
  name: string;
  description?: string;
};
