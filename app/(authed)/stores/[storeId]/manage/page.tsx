import { StoreManagePage } from "@/components/pages/StoreManagePage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <StoreManagePage storeId={storeId} />;
}
