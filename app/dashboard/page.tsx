"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReservations } from "@/hooks/queries/useReservations";
import { useAppStore } from "@/stores/useAppStore";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const selectedStoreId = useAppStore((state) => state.selectedStoreId);
  const {
    data: reservations = [],
    isLoading,
    error,
  } = useReservations(selectedStoreId ?? undefined);

  const todayCount = useMemo(() => {
    const today = getTodayKey();
    return reservations.filter((item) => item.reservationTime.startsWith(today))
      .length;
  }, [reservations]);

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
        <h1 className="text-2xl font-semibold">{"\uB300\uC2DC\uBCF4\uB4DC"}</h1>
        <p className="text-sm text-slate-500">{`Store: ${selectedStoreId}`}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{"\uC624\uB298\uC758 \uC608\uC57D"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-slate-200" />
          ) : error ? (
            <div className="text-sm text-rose-600">
              {"\uC608\uC57D \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."}
            </div>
          ) : (
            <div className="text-3xl font-semibold">{todayCount}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
