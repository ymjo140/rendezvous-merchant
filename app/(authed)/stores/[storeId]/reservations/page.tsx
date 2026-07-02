import { ReservationsPage } from "@/components/pages/ReservationsPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <ReservationsPage storeId={storeId} />;
}
