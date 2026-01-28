export function ReservationDetailPage({
  reservationId,
}: {
  reservationId?: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">예약 상세</h1>
      <p className="text-sm text-slate-500">예약 ID: {reservationId}</p>
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="text-sm text-slate-600">상세 정보가 여기에 표시됩니다.</div>
      </div>
    </div>
  );
}


