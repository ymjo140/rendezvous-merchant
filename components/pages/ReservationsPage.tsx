import { Table, Td, Th } from "@/components/ui/table";

const mockReservations = [
  { id: "R-101", guest: "김민수", party: 4, time: "18:30", status: "confirmed" },
  { id: "R-102", guest: "이서연", party: 2, time: "19:00", status: "pending" },
];

export function ReservationsPage({ storeId }: { storeId?: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">예약 목록</h1>
        <p className="text-sm text-slate-500">Store #{storeId}</p>
      </div>
      <Table>
        <thead>
          <tr>
            <Th>예약 ID</Th>
            <Th>게스트</Th>
            <Th>인원</Th>
            <Th>시간</Th>
            <Th>상태</Th>
          </tr>
        </thead>
        <tbody>
          {mockReservations.map((row) => (
            <tr key={row.id}>
              <Td>{row.id}</Td>
              <Td>{row.guest}</Td>
              <Td>{row.party}명</Td>
              <Td>{row.time}</Td>
              <Td>{row.status}</Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}


