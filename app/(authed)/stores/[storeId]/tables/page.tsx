import { SubTabs, MANAGE_TABS } from "@/components/layout/SubTabs";
import { TableMapPage } from "@/components/pages/TableMapPage";

// Next 15+: 라우트 params는 Promise — await로 언랩해야 함(동기 접근 시 undefined)
export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return (
    <>
      <SubTabs storeId={storeId} tabs={MANAGE_TABS} />
      <TableMapPage storeId={storeId} />
    </>
  );
}
