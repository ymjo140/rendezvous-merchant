"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getMerchantStores } from "@/lib/api/stores";
import type { StoreSummary } from "@/domain/stores/types";

export default function Page() {
  const router = useRouter();
  const [stores, setStores] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        // Supabase 직접(owner_id=내 계정) — FastAPI 401/mock 폴백 제거
        const data = await getMerchantStores();
        if (active) setStores(data);
      } catch {
        if (active) setStores([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">매장 선택</h1>

      {loading ? (
        <p className="text-sm text-slate-400">내 매장을 불러오는 중...</p>
      ) : stores.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="text-3xl">🏪</div>
          <p className="mt-2 text-sm font-semibold text-slate-700">아직 등록된 매장이 없어요</p>
          <p className="mt-1 text-xs text-slate-500">
            가게를 등록하면 예약·핫딜·AI 수익엔진을 바로 쓸 수 있어요.
          </p>
          <Button className="mt-4" onClick={() => router.push("/onboarding")}>
            + 내 매장 등록하기
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {stores.map((store) => (
            <div key={store.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="font-medium">{store.name}</div>
              <div className="text-xs text-slate-500">{store.address || `매장 번호: ${store.id}`}</div>
              <Button className="mt-3" onClick={() => router.push(`/stores/${store.id}`)}>
                선택
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
