import { TableMapPage } from "@/components/pages/TableMapPage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <TableMapPage storeId={params.storeId} />;
}
