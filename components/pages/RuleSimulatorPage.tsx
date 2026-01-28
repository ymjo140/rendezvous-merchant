import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function RuleSimulatorPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Rule Simulator</h1>
      <Card>
        <CardHeader>
          <CardTitle>시뮬레이션</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-600">
          선택한 규칙이 어떤 조건에서 노출되는지 확인합니다.
        </CardContent>
      </Card>
    </div>
  );
}


