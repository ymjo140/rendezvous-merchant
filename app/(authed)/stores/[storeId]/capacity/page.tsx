import { CapacityPage } from "@/components/pages/CapacityPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <CapacityPage storeId={storeId} />;
}