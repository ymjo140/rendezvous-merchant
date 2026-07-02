import { RuleBuilderPage } from "@/components/pages/RuleBuilderPage";

export default async function Page({
  params,
}: {
  params: Promise<{ storeId: string; ruleId: string }>;
}) {
  const { storeId, ruleId } = await params;
  return <RuleBuilderPage storeId={storeId} ruleId={ruleId} />;
}
