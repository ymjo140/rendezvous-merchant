export type RuleBuilderState = {
  name: string;
  enabled: boolean;
  daysOfWeek: boolean[];
  timeBlocks: Array<{ start: string; end: string }>;
  partySize: { min?: number; max?: number };
  leadTime: { min?: number; max?: number };
  benefitId?: number | string | null;
  benefitValue: Record<string, unknown>;
  guardrails?: Record<string, unknown> | null;
  priority: number;
};

export type OfferRulePayload = {
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
};

export function encodeDayOfWeekMask(daysOfWeek: boolean[]) {
  return daysOfWeek.reduce((mask, enabled, index) =>
    enabled ? mask | (1 << index) : mask,
  0);
}

export function decodeDayOfWeekMask(mask: number) {
  return Array.from({ length: 7 }, (_, index) => (mask & (1 << index)) !== 0);
}

export function toOfferRulePayload(state: RuleBuilderState): OfferRulePayload {
  return {
    name: state.name,
    enabled: state.enabled,
    day_of_week_mask: encodeDayOfWeekMask(state.daysOfWeek),
    time_blocks: state.timeBlocks,
    party_size_min: state.partySize.min ?? null,
    party_size_max: state.partySize.max ?? null,
    lead_time_min_minutes: state.leadTime.min ?? null,
    lead_time_max_minutes: state.leadTime.max ?? null,
    benefit_id: state.benefitId ?? null,
    benefit_value: state.benefitValue,
    guardrails: state.guardrails ?? null,
    priority: state.priority,
  };
}

export function fromOfferRule(rule: {
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
  priority?: number | null;
}): RuleBuilderState {
  return {
    name: rule.name,
    enabled: rule.enabled,
    daysOfWeek: decodeDayOfWeekMask(rule.day_of_week_mask),
    timeBlocks: rule.time_blocks,
    partySize: {
      min: rule.party_size_min ?? undefined,
      max: rule.party_size_max ?? undefined,
    },
    leadTime: {
      min: rule.lead_time_min_minutes ?? undefined,
      max: rule.lead_time_max_minutes ?? undefined,
    },
    benefitId: rule.benefit_id ?? null,
    benefitValue: rule.benefit_value,
    guardrails: rule.guardrails ?? null,
    priority: rule.priority ?? 0,
  };
}


