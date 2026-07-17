import { SubTabs, OFFER_TABS } from "@/components/layout/SubTabs";
import { YieldEnginePage } from "@/components/pages/YieldEnginePage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <>
      <SubTabs storeId={storeId} tabs={OFFER_TABS} />
      <YieldEnginePage storeId={storeId} />
    </>
  );
}
