import { BenefitsCatalogPage } from "@/components/pages/BenefitsCatalogPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <BenefitsCatalogPage storeId={storeId} />;
}