import { supabase } from "@/lib/supabase/client";
import type { StoreSummary } from "@/domain/stores/types";

// ⚠️ 사장님 인증은 Supabase Auth(uuid)라서 FastAPI(/api/merchant/stores)는
// 토큰을 해독하지 못해 401이 났음(신규 매장 등록 전원 실패 버그).
// → 온보딩과 동일하게 Supabase 직접 조회/클레임으로 전환.

export type CreateStorePayload = {
  place_id?: string | number;
  name?: string;
  category?: string;
  address?: string;
};

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) throw new Error("로그인이 필요합니다. 다시 로그인해주세요.");
  return data.user.id;
}

export async function getMerchantStores(): Promise<StoreSummary[]> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("places")
    .select("id, name, address")
    .eq("owner_id", userId)
    .order("id", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    address: p.address ?? "",
  })) as StoreSummary[];
}

export async function createMerchantStore(payload: CreateStorePayload): Promise<StoreSummary> {
  const userId = await requireUserId();

  // 1) 기존 매장 클레임 (DB 12만 장소 중 선택)
  if (payload.place_id !== undefined && payload.place_id !== null) {
    const placeId = Number(payload.place_id);
    const { data: place, error } = await supabase
      .from("places")
      .select("id, name, address, owner_id")
      .eq("id", placeId)
      .maybeSingle();
    if (error || !place) throw new Error("매장을 찾을 수 없습니다.");

    if (place.owner_id && String(place.owner_id) !== String(userId)) {
      throw new Error("이미 다른 사장님이 등록한 매장이에요. 본인 매장이라면 고객센터로 문의해주세요.");
    }

    if (!place.owner_id) {
      const { error: upErr } = await supabase
        .from("places")
        .update({ owner_id: userId })
        .eq("id", placeId);
      if (upErr) throw new Error("매장 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
    return { id: place.id, name: place.name, address: place.address ?? "" } as StoreSummary;
  }

  // 2) 신규 매장 생성 (DB에 없는 가게)
  if (!payload.name?.trim()) throw new Error("매장 이름을 입력해주세요.");
  const { data: created, error: insErr } = await supabase
    .from("places")
    .insert({
      name: payload.name.trim(),
      category: payload.category ?? null,
      cuisine_type: payload.category ?? null,
      address: payload.address ?? null,
      owner_id: userId,
      lat: 37.5665,
      lng: 126.978,
    })
    .select("id, name, address")
    .single();
  if (insErr || !created) throw new Error("매장 생성에 실패했어요.");
  return { id: created.id, name: created.name, address: created.address ?? "" } as StoreSummary;
}
