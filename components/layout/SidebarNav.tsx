"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "대시보드", slug: "" },
  { label: "예약", slug: "reservations" },
  { label: "룰 설정", slug: "offers/rules" },
  { label: "혜택 카탈로그", slug: "offers/benefits" },
  { label: "룰 시뮬레이터", slug: "offers/simulator" },
  { label: "수용량", slug: "capacity" },
  { label: "인사이트", slug: "insights" },
  { label: "설정", slug: "settings" },
];

export function SidebarNav({
  storeId,
  onNavigate,
}: {
  storeId: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col gap-4 p-6">
      <div className="text-lg font-semibold">렌데부</div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        사장님 콘솔
      </div>
      <div className="mt-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const href = storeId
            ? item.slug
              ? `/stores/${storeId}/${item.slug}`
              : `/stores/${storeId}`
            : "/stores/select";
          const isActive = pathname === href;
          return (
            <Link
              key={item.label}
              href={href}
              onClick={onNavigate}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}