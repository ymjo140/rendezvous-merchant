import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HotDealCard({
  title,
  benefit,
  timer,
  visibility,
}: {
  title: string;
  benefit: string;
  timer: string;
  visibility?: "public" | "private";
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700">핫딜</Badge>
            {visibility === "private" ? (
              <Badge className="bg-slate-900 text-white">시크릿 오퍼</Badge>
            ) : null}
          </div>
          <span className="text-xs text-slate-500">{timer}</span>
        </div>
        <div className="text-lg font-semibold">{benefit}</div>
        <div className="text-sm text-slate-600">{title}</div>
        <div className="text-xs text-slate-500">
          {visibility === "private" ? "비공개 제안" : "공개"}
        </div>
      </CardContent>
    </Card>
  );
}