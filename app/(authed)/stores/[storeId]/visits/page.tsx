import { VisitDeskPage } from "@/components/pages/VisitDeskPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <VisitDeskPage storeId={storeId} />;
}
