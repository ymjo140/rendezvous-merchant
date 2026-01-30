import { CapacityPage } from "@/components/pages/CapacityPage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <CapacityPage storeId={params.storeId} />;
}