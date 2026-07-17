"use client";

// 페이지 상단 서브탭 — 사이드바 5메뉴 재편에 따라 그룹(핫딜/가게 관리) 내부 이동용.
// 모바일에서도 가로 스크롤로 동작.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export type SubTabItem = { label: string; slug: string };

export const OFFER_TABS: SubTabItem[] = [
  { label: "🤖 AI 제안", slug: "offers/ai" },
  { label: "🔥 내 핫딜", slug: "offers/rules" },
  { label: "🎁 혜택", slug: "offers/benefits" },
  { label: "👀 미리보기", slug: "offers/simulator" },
];

export const MANAGE_TABS: SubTabItem[] = [
  { label: "🍽️ 메뉴", slug: "menus" },
  { label: "🗺️ 테이블 맵", slug: "tables" },
  { label: "🪑 좌석 수용량", slug: "capacity" },
  { label: "⚙️ 가게 정보", slug: "settings" },
];

export function SubTabs({ storeId, tabs }: { storeId: string; tabs: SubTabItem[] }) {
  const pathname = usePathname();
  return (
    <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((t) => {
        const href = `/stores/${storeId}/${t.slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={t.slug}
            href={href}
            className={cn(
              "flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors",
              active
                ? "border-brand bg-brand text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
