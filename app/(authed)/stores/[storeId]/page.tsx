import { HomePage } from "@/components/pages/HomePage";

export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  return <HomePage storeId={storeId} />;
}
