import { redirect } from "next/navigation";

// 인사이트 페이지는 분석 v2('가게 흐름' 서브탭)로 통합됨 — 구 링크 호환용 리다이렉트
export default async function Page({ params }: { params: Promise<{ storeId: string }> }) {
  const { storeId } = await params;
  redirect(`/stores/${storeId}/offers/ai`);
}
