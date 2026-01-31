import { StoreIdProvider } from "@/components/layout/Layout";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return <StoreIdProvider storeId={storeId}>{children}</StoreIdProvider>;
}
