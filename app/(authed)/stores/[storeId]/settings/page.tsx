import { SubTabs, MANAGE_TABS } from "@/components/layout/SubTabs";
import { SettingsPage } from "@/components/pages/SettingsPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <>
      <SubTabs storeId={storeId} tabs={MANAGE_TABS} />
      <SettingsPage storeId={storeId} />
    </>
  );
}