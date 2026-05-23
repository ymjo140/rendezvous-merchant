import { YieldEnginePage } from "@/components/pages/YieldEnginePage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <YieldEnginePage storeId={params.storeId} />;
}
