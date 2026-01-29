import { SettingsPage } from "@/components/pages/SettingsPage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <SettingsPage storeId={params.storeId} />;
}