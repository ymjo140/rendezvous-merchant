import { InsightsPage } from "@/components/pages/InsightsPage";

export default function Page({ params }: { params: { storeId: string } }) {
  return <InsightsPage storeId={params.storeId} />;
}