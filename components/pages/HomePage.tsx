import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function HomePage({ storeId }: { storeId?: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">대시보드</h1>
        <p className="text-sm text-slate-500">Store #{storeId}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "오늘 예약", value: "12" },
          { label: "활성 규칙", value: "4" },
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


