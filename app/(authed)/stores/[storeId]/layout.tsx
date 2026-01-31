import { StoreIdProvider } from "@/components/layout/Layout";

export default function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeId: string };
}) {
  return <StoreIdProvider storeId={params.storeId}>{children}</StoreIdProvider>;
}
