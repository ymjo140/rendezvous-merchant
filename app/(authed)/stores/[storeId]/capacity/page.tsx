import { redirect } from "next/navigation";

// 좌석 수용량은 테이블 맵으로 통합됨(맵이 원천, table_units는 자동 파생) — 구 링크 호환용
export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${storeId}/tables`);
}
