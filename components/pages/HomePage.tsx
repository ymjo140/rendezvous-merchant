"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const feedItems = [
  "방금 4명 그룹이 [평일 저녁 룰]에 매칭되었습니다! ⚡",
  "현재 2팀이 사장님의 제안을 보고 있습니다.",
  "방금 예약이 확정되었습니다.",
];

export function HomePage({ storeId }: { storeId?: string }) {
  const [logs, setLogs] = useState<string[]>([feedItems[0]]);

  useEffect(() => {
    let index = 1;
    const timer = setInterval(() => {
      setLogs((prev) => [feedItems[index % feedItems.length], ...prev].slice(0, 4));
      index += 1;
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-sm text-slate-500">매장 #{storeId}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>실시간 매칭 현황</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          {logs.map((item, idx) => (
            <div key={`${item}-${idx}`} className="rounded-md bg-slate-50 px-3 py-2">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "예약", value: "12" },
          { label: "활성 룰", value: "4" },
          { label: "혜택 사용", value: "23" },
        ].map((item) => (
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
    </div>
  );
}