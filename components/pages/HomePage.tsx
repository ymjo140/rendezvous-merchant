"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const feedItems = [
  "방금 4명 그룹이 [평일 저녁 룰]에 매칭되었습니다! ⚡",
  "현재 2팀이 사장님의 제안을 보고 있습니다.",
  "방금 예약이 확정되었습니다.",
];

const mockStore = {
  region: "안암동",
  category: "한식",
};

function buildLeadSnapshot() {
  const groupSizes = [2, 3, 4, 5, 6];
  const teams = [2, 3, 4, 5, 6, 7, 8];
  const groupSize = groupSizes[Math.floor(Math.random() * groupSizes.length)];
  const teamCount = teams[Math.floor(Math.random() * teams.length)];
  return { groupSize, teamCount };
}

export function HomePage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([feedItems[0]]);
  const [leadSnapshot] = useState(buildLeadSnapshot);

  useEffect(() => {
    let index = 1;
    const timer = setInterval(() => {
      setLogs((prev) => [feedItems[index % feedItems.length], ...prev].slice(0, 4));
      index += 1;
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const demandMessage = useMemo(() => {
    return `👀 현재 ${mockStore.region}에서 ${mockStore.category}을 찾는 ${leadSnapshot.groupSize}명 그룹 ${leadSnapshot.teamCount}팀이 사장님 가게를 주목하고 있습니다!`;
  }, [leadSnapshot]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-900 bg-slate-900 text-white">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="space-y-2">
            <div className="text-sm text-slate-200">타겟 수요 레이더</div>
            <div className="text-lg font-semibold">{demandMessage}</div>
          </div>
          <Button
            className="bg-white text-slate-900 hover:bg-slate-100"
            onClick={() =>
              router.push(`/stores/${storeId ?? "1"}/offers/rules/new`)
            }
          >
            ⚡ 이 손님 잡으러 가기
          </Button>
        </CardContent>
      </Card>

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