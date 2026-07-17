import { SubTabs, OFFER_TABS } from "@/components/layout/SubTabs";
import { OfferRulesPage } from "@/components/pages/OfferRulesPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <>
      <SubTabs storeId={storeId} tabs={OFFER_TABS} />
      <OfferRulesPage storeId={storeId} />
    </>
  );
}
