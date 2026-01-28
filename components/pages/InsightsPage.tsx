"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const fallbackMetrics = {
  kpis: [
    { label: "예약", value: 128 },
    { label: "전환율", value: "18%" },
    { label: "매출", value: "3.2M" },
    { label: "혜택 사용", value: "42" },
  ],
  trends: [
    { label: "점심", value: 42 },
    { label: "저녁", value: 86 },
    { label: "주말", value: 55 },
  ],
};

export function InsightsPage({ storeId }: { storeId?: string }) {
  const [metrics, setMetrics] = useState(fallbackMetrics);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!storeId || !baseURL) {
        setMetrics(fallbackMetrics);
        return;
      }

      try {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
        const to = today.toISOString().slice(0, 10);

        const data = await fetchWithAuth<any>(endpoints.metrics(storeId, from, to));
        if (active && data) {
          setMetrics(data);
        }
      } catch {
        if (active) setMetrics(fallbackMetrics);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [storeId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">인사이트</h1>
        <p className="text-sm text-slate-500">매장 #{storeId}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {metrics.kpis.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {item.value}
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.trends.map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-xl font-semibold">
              {item.value}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

