import { MenuManagementPage } from "@/components/pages/MenuManagementPage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <MenuManagementPage storeId={params.storeId} />;
}
