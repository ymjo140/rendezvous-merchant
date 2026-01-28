export type BenefitType =
  | "percentage_discount"
  | "fixed_discount"
  | "free_item"
  | "set_menu"
  | "other";

export type Benefit = {
  id: number | string;
  place_id?: number | string | null;
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


