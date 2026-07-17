import { SubTabs, MANAGE_TABS } from "@/components/layout/SubTabs";
import { MenuManagementPage } from "@/components/pages/MenuManagementPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <>
      <SubTabs storeId={storeId} tabs={MANAGE_TABS} />
      <MenuManagementPage storeId={storeId} />
    </>
  );
}
