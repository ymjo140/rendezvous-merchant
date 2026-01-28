import { BenefitsCatalogPage } from "@/components/pages/BenefitsCatalogPage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <BenefitsCatalogPage storeId={params.storeId} />;
}