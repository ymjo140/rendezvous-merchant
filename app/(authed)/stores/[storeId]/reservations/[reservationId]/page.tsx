import { ReservationDetailPage } from "@/components/pages/ReservationDetailPage";

export default async function Page({
  params,
}: {
  params: Promise<{ storeId: string; reservationId: string }>;
}) {
  const { reservationId } = await params;
  return <ReservationDetailPage reservationId={reservationId} />;
}
