import { YieldEnginePage } from "@/components/pages/YieldEnginePage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <YieldEnginePage storeId={storeId} />;
}
