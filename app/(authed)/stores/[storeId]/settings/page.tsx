import { SettingsPage } from "@/components/pages/SettingsPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <SettingsPage storeId={storeId} />;
}