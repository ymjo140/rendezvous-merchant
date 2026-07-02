import { RuleBuilderPage } from "@/components/pages/RuleBuilderPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <RuleBuilderPage storeId={storeId} />;
}