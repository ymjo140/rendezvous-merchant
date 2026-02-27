"use client";

import { useReservations } from "@/hooks/queries/useReservations";
import { useAppStore } from "@/stores/useAppStore";
import { Table, Td, Th } from "@/components/ui/table";

const statusLabel: Record<string, string> = {
  pending: "\uB300\uAE30",
  confirmed: "\uD655\uC815",
  completed: "\uC644\uB8CC",
  cancelled: "\uCDE8\uC18C",
};

export default function ReservationsPage() {
  const selectedStoreId = useAppStore((state) => state.selectedStoreId);
  const { data = [], isLoading, error } = useReservations(
    selectedStoreId ?? undefined
  );

  if (!selectedStoreId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
        {"\uB9E4\uC7A5\uC744 \uC120\uD0DD\uD574 \uC8FC\uC138\uC694."}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{"\uC608\uC57D \uBAA9\uB85D"}</h1>
        <p className="text-sm text-slate-500">{`Store: ${selectedStoreId}`}</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="h-10 w-full animate-pulse rounded bg-slate-200"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-rose-600">
          {"\uC608\uC57D \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4."}
        </div>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{"\uC608\uC57D \uBC88\uD638"}</Th>
              <Th>{"\uACE0\uAC1D"}</Th>
              <Th>{"\uC778\uC6D0"}</Th>
              <Th>{"\uC2DC\uAC04"}</Th>
              <Th>{"\uC0C1\uD0DC"}</Th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <Td colSpan={5}>
                  <div className="py-6 text-center text-sm text-slate-500">
                    {"\uB4F1\uB85D\uB41C \uC608\uC57D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
                  </div>
                </Td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id}>
                  <Td>{row.id}</Td>
                  <Td>{row.customerName}</Td>
                  <Td>{row.partySize}</Td>
                  <Td>{row.reservationTime}</Td>
                  <Td>{statusLabel[row.status] ?? row.status}</Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      )}
    </div>
  );
}
