import { RuleBuilderPage } from "@/components/pages/RuleBuilderPage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <RuleBuilderPage storeId={params.storeId} />;
}