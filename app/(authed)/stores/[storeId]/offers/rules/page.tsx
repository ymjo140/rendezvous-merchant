import { OfferRulesPage } from "@/components/pages/OfferRulesPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <OfferRulesPage storeId={storeId} />;
}
