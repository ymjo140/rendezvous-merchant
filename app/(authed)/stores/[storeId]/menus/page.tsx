import { MenuManagementPage } from "@/components/pages/MenuManagementPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <MenuManagementPage storeId={storeId} />;
}
