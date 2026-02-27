"use client";

import { usePromotions } from "@/hooks/queries/usePromotions";
import { useAppStore } from "@/stores/useAppStore";
import { HotDealCard } from "@/components/offers/HotDealCard";

function formatTimer(endTime: string) {
  return endTime ? `\uB9C8\uAC10\uAE4C\uC9C0 ${endTime}` : "\uB9C8\uAC10\uC784\uBC15";
}

export default function PromotionsPage() {
  const selectedStoreId = useAppStore((state) => state.selectedStoreId);
  const { data = [], isLoading, error } = usePromotions(
    selectedStoreId ?? undefined
  );

  if (!selectedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"\uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"\uD0C0\uC784\uC138\uC77C \uD504\uB85C\uBAA8\uC158"}</h1>
        <p className="text-sm text-slate-500">{`Store: ${selectedStoreId}`}</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={`promo-skel-${idx}`} className="h-64 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-rose-600">
          {"\uD504\uB85C\uBAA8\uC158 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          {"\uD604\uC7AC \uD65C\uC131\uD654\uB41C \uD504\uB85C\uBAA8\uC158\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((promotion) => (
            <HotDealCard
              key={promotion.id}
              title={promotion.title}
              benefit={promotion.benefit}
              timer={formatTimer(promotion.endTime)}
              storeName={promotion.storeName ?? "\uB791\uB370\uBD80 \uB9E4\uC7A5"}
              imageUrl={promotion.imageUrl}
            />
          ))}
        </div>
      )}
    </div>
  );
}
