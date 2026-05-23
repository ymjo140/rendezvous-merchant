import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";

export type RuleRow = {
  id: string;
  store_id?: string;
  place_id?: number | null;
  name: string;
  enabled: boolean;
  days: boolean[];
  recurrence_days?: string[] | null;
  active_time_start?: string | null;
  active_time_end?: string | null;
  is_auto_apply?: boolean | null;
  time_blocks: Array<{ start: string; end: string }>;
  party_min?: number | null;
  party_max?: number | null;
  lead_min?: number | null;
  lead_max?: number | null;
  benefit_id?: string | null;
  benefit_title?: string | null;
  benefit_type?: string | null;
  benefit_value?: string | null;
  guardrails?: { daily_cap?: number; min_spend?: number } | null;
  visibility?: "public" | "private" | null;
  created_at?: string;
};

type DbRuleRow = {
  id?: number | string;
  place_id?: number | null;
  store_id?: string | null;
  rule_name?: string | null;
  day_of_week_mask?: number | null;
  recurrence_days?: string[] | null;
  active_time_start?: string | null;
  active_time_end?: string | null;
  is_auto_apply?: boolean | null;
  time_blocks_json?: Array<{ start: string; end: string }> | null;
  party_size_min?: number | null;
  party_size_max?: number | null;
  lead_time_thresholds_json?: { min?: number; max?: number } | null;
  base_benefit_json?: { id?: string; type?: string; value?: string; title?: string } | null;
  enabled?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  benefit_id?: string | null;
  benefit_title?: string | null;
  benefit_type?: string | null;
  benefit_value?: string | null;
  guardrails?: { daily_cap?: number; min_spend?: number } | null;
  visibility?: string | null;
};

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchRules(storeId?: string) {
  if (!storeId || !isSupabaseConfigured) return [] as RuleRow[];
  const placeId = Number(storeId);
  const { data, error } = await supabase
    .from("offer_rules")
    .select("*")
    .eq("place_id", Number.isFinite(placeId) ? placeId : storeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as DbRuleRow[];
  return rows.map(mapDbRuleToRuleRow);
}

function maskToDays(mask?: number | null) {
  const result = Array.from({ length: 7 }, () => false);
  if (!mask) return result;
  for (let index = 0; index < 7; index += 1) {
    result[index] = (mask & (1 << index)) !== 0;
  }
  return result;
}

function daysToMask(days: boolean[]) {
  return days.reduce((acc, enabled, index) => (enabled ? acc | (1 << index) : acc), 0);
}

function mapDbRuleToRuleRow(row: DbRuleRow): RuleRow {
  const benefitFromJson = row.base_benefit_json ?? {};
  const lead = row.lead_time_thresholds_json ?? {};
  return {
    id: String(row.id),
    store_id: row.store_id ?? undefined,
    place_id: row.place_id ?? undefined,
    name: row.rule_name ?? "",
    enabled: row.enabled ?? true,
    days: row.day_of_week_mask ? maskToDays(row.day_of_week_mask) : [],
    recurrence_days: row.recurrence_days ?? null,
    active_time_start: row.active_time_start ?? null,
    active_time_end: row.active_time_end ?? null,
    is_auto_apply: row.is_auto_apply ?? null,
    time_blocks: row.time_blocks_json ?? [],
    party_min: row.party_size_min ?? null,
    party_max: row.party_size_max ?? null,
    lead_min: lead.min ?? null,
    lead_max: lead.max ?? null,
    benefit_id: row.benefit_id ?? benefitFromJson.id ?? null,
    benefit_title: row.benefit_title ?? benefitFromJson.title ?? null,
    benefit_type: row.benefit_type ?? benefitFromJson.type ?? null,
    benefit_value: row.benefit_value ?? benefitFromJson.value ?? null,
    guardrails: row.guardrails ?? null,
    visibility: (row.visibility as "public" | "private" | null) ?? null,
    created_at: row.created_at ?? undefined,
  };
}

function mapRuleRowToDb(row: RuleRow): DbRuleRow {
  return {
    place_id: row.place_id ?? null,
    store_id: row.store_id ?? null,
    rule_name: row.name,
    day_of_week_mask: daysToMask(row.days ?? []),
    recurrence_days: row.recurrence_days ?? [],
    active_time_start: row.active_time_start ?? null,
    active_time_end: row.active_time_end ?? null,
    is_auto_apply: row.is_auto_apply ?? null,
    time_blocks_json: row.time_blocks ?? [],
    party_size_min: row.party_min ?? null,
    party_size_max: row.party_max ?? null,
    lead_time_thresholds_json: {
      min: row.lead_min ?? undefined,
      max: row.lead_max ?? undefined,
    },
    base_benefit_json: {
      id: row.benefit_id ?? undefined,
      type: row.benefit_type ?? undefined,
      value: row.benefit_value ?? undefined,
      title: row.benefit_title ?? undefined,
    },
    enabled: row.enabled ?? true,
    benefit_id: row.benefit_id ?? null,
    benefit_title: row.benefit_title ?? null,
    benefit_type: row.benefit_type ?? null,
    benefit_value: row.benefit_value ?? null,
    guardrails: row.guardrails ?? null,
    visibility: row.visibility ?? null,
  };
}

function mapRuleUpdateToDb(payload: Partial<RuleRow>) {
  const update: Partial<DbRuleRow> = {};
  if (payload.place_id !== undefined) update.place_id = payload.place_id ?? null;
  if (payload.store_id !== undefined) update.store_id = payload.store_id ?? null;
  if (payload.name !== undefined) update.rule_name = payload.name;
  if (payload.days !== undefined) update.day_of_week_mask = daysToMask(payload.days);
  if (payload.recurrence_days !== undefined) update.recurrence_days = payload.recurrence_days ?? [];
  if (payload.active_time_start !== undefined)
    update.active_time_start = payload.active_time_start ?? null;
  if (payload.active_time_end !== undefined)
    update.active_time_end = payload.active_time_end ?? null;
  if (payload.is_auto_apply !== undefined)
    update.is_auto_apply = payload.is_auto_apply ?? null;
  if (payload.time_blocks !== undefined) update.time_blocks_json = payload.time_blocks;
  if (payload.party_min !== undefined) update.party_size_min = payload.party_min ?? null;
  if (payload.party_max !== undefined) update.party_size_max = payload.party_max ?? null;
  if (payload.lead_min !== undefined || payload.lead_max !== undefined) {
    update.lead_time_thresholds_json = {
      min: payload.lead_min ?? undefined,
      max: payload.lead_max ?? undefined,
    };
  }
  if (
    payload.benefit_id !== undefined ||
    payload.benefit_type !== undefined ||
    payload.benefit_value !== undefined ||
    payload.benefit_title !== undefined
  ) {
    update.base_benefit_json = {
      id: payload.benefit_id ?? undefined,
      type: payload.benefit_type ?? undefined,
      value: payload.benefit_value ?? undefined,
      title: payload.benefit_title ?? undefined,
    };
  }
  if (payload.enabled !== undefined) update.enabled = payload.enabled;
  if (payload.benefit_id !== undefined) update.benefit_id = payload.benefit_id ?? null;
  if (payload.benefit_title !== undefined) update.benefit_title = payload.benefit_title ?? null;
  if (payload.benefit_type !== undefined) update.benefit_type = payload.benefit_type ?? null;
  if (payload.benefit_value !== undefined) update.benefit_value = payload.benefit_value ?? null;
  if (payload.guardrails !== undefined) update.guardrails = payload.guardrails ?? null;
  if (payload.visibility !== undefined) update.visibility = payload.visibility ?? null;
  return update;
}

export function useRules(storeId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["rules", storeId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchRules(storeId),
    enabled: Boolean(storeId) && isSupabaseConfigured,
  });

  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const placeId = Number(storeId);
    const filterValue = Number.isFinite(placeId) ? placeId : storeId;
    const channel = supabase
      .channel(`rules-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offer_rules",
          filter: `place_id=eq.${filterValue}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);

  const createRule = useMutation({
    mutationFn: async (payload: RuleRow) => {
      if (!isSupabaseConfigured) return payload;
      const dbPayload = mapRuleRowToDb(payload);
      const { error } = await supabase.from("offer_rules").insert(dbPayload);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RuleRow[]>(queryKey) ?? [];
      queryClient.setQueryData(queryKey, [payload, ...previous]);
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateRule = useMutation({
    mutationFn: async (payload: Partial<RuleRow> & { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { id, ...rest } = payload;
      const dbPayload = mapRuleUpdateToDb(rest);
      const { error } = await supabase
        .from("offer_rules")
        .update(dbPayload)
        .eq("id", id);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RuleRow[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previous.map((item) =>
          item.id === payload.id ? { ...item, ...payload } : item
        )
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (payload: { id: string }) => {
      if (!isSupabaseConfigured) return payload;
      const { error } = await supabase
        .from("offer_rules")
        .delete()
        .eq("id", payload.id);
      if (error) throw error;
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<RuleRow[]>(queryKey) ?? [];
      queryClient.setQueryData(
        queryKey,
        previous.filter((item) => item.id !== payload.id)
      );
      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...query,
    createRule,
    updateRule,
    deleteRule,
    isSupabaseConfigured,
  };
}
