import { StoreIdProvider } from "@/components/layout/Layout";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeId: string };
}) {
  const { storeId } = params;
  return <StoreIdProvider storeId={storeId}>{children}</StoreIdProvider>;
}
