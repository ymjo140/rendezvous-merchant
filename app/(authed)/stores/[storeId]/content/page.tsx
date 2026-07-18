import { CustomerContentPage } from "@/components/pages/CustomerContentPage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <CustomerContentPage storeId={storeId} />;
}
