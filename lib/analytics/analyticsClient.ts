import { fetchWithAuth } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

export type ActionPayload = {
  action_type: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
};

export async function logAction(payload: ActionPayload) {
  return fetchWithAuth(endpoints.aiActions, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


