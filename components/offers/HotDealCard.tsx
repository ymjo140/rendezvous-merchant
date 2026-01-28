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
          <Badge className="bg-amber-100 text-amber-700">HOT DEAL</Badge>
          <span className="text-xs text-slate-500">{timer}</span>
        </div>
        <div className="text-lg font-semibold">{benefit}</div>
        <div className="text-sm text-slate-600">{title}</div>
        <div className="text-xs text-slate-500">
          {visibility === "private"
            ? "\uBE44\uACF5\uAC1C \uC81C\uC548"
            : "\uACF5\uAC1C"}
        </div>
      </CardContent>
    </Card>
  );
}
