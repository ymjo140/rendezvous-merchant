import { SubTabs, MANAGE_TABS } from "@/components/layout/SubTabs";
import { CapacityPage } from "@/components/pages/CapacityPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <>
      <SubTabs storeId={storeId} tabs={MANAGE_TABS} />
      <CapacityPage storeId={storeId} />
    </>
  );
}