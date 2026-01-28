"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchWithAuth, baseURL } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const fallbackMetrics = {
  kpis: [
    { label: "Reservations", value: 128 },
    { label: "Conversion", value: "18%" },
    { label: "Revenue", value: "3.2M" },
    { label: "Offer usage", value: "42" },
  ],
  trends: [
    { label: "Lunch", value: 42 },
    { label: "Dinner", value: 86 },
    { label: "Weekend", value: 55 },
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
        <h1 className="text-2xl font-semibold">Insights</h1>
        <p className="text-sm text-slate-500">Store #{storeId}</p>
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