import { PartnershipsPage } from "@/components/pages/PartnershipsPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <PartnershipsPage storeId={storeId} />;
}
