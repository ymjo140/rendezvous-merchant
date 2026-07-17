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
      // RLS 소유권 잠금 하에서 미소유 place의 owner 지정은 claim_store 함수로만 가능
      // (직접 UPDATE는 정책상 차단됨 — 반달리즘 방지).
      const { error: claimErr } = await supabase.rpc("claim_store", { p_place_id: placeId });
      if (claimErr) throw new Error("매장 등록에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
    return { id: place.id, name: place.name, address: place.address ?? "" } as StoreSummary;
  }

  // 2) 신규 매장 생성 (DB에 없는 가게)
  if (!payload.name?.trim()) throw new Error("매장 이름을 입력해주세요.");
  // 주소 지오코딩 — 좌표가 서울시청 고정이면 B2C 지도/거리 추천이 전부 틀어짐
  const coords = (await geocodeAddress(payload.address)) ?? { lat: 37.5665, lng: 126.978 };
  const { data: created, error: insErr } = await supabase
    .from("places")
    .insert({
      name: payload.name.trim(),
      category: payload.category ?? null,
      cuisine_type: payload.category ?? null,
      address: payload.address ?? null,
      owner_id: userId,
      lat: coords.lat,
      lng: coords.lng,
    })
    .select("id, name, address")
    .single();
  if (insErr || !created) throw new Error("매장 생성에 실패했어요.");
  return { id: created.id, name: created.name, address: created.address ?? "" } as StoreSummary;
}

// 주소 → 좌표 (B2C 백엔드 공개 지오코딩 재사용). 실패 시 null(호출부에서 폴백).
async function geocodeAddress(address?: string | null): Promise<{ lat: number; lng: number } | null> {
  const addr = (address ?? "").trim();
  if (!addr) return null;
  try {
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    if (!base) return null;
    const res = await fetch(`${base}/api/geocode?query=${encodeURIComponent(addr)}`);
    if (!res.ok) return null;
    const items = await res.json();
    const hit = Array.isArray(items) ? items.find((x: any) => x?.lat && x?.lng) : null;
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lng) } : null;
  } catch {
    return null;
  }
}
