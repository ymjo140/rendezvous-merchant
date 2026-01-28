import { Button } from "@/components/ui/button";

const mockBenefits = [
  { id: 1, title: "음료 1잔", type: "free_item" },
  { id: 2, title: "10% 할인", type: "percentage_discount" },
];

export function BenefitsCatalogPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Benefits Catalog</h1>
        <Button>혜택 추가</Button>
      </div>
      <div className="space-y-3">
        {mockBenefits.map((benefit) => (
          <div
            key={benefit.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="font-medium">{benefit.title}</div>
            <div className="text-xs text-slate-500">{benefit.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


