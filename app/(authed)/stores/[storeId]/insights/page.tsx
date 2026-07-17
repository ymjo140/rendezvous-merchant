import { SubTabs, ANALYTICS_TABS } from "@/components/layout/SubTabs";
import { InsightsPage } from "@/components/pages/InsightsPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <>
      <SubTabs storeId={storeId} tabs={ANALYTICS_TABS} />
      <InsightsPage storeId={storeId} />
    </>
  );
}
