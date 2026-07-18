import { RegularsPage } from "@/components/pages/RegularsPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <RegularsPage storeId={storeId} />;
}
