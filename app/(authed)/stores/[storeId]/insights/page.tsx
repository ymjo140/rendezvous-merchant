import { InsightsPage } from "@/components/pages/InsightsPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <InsightsPage storeId={storeId} />;
}