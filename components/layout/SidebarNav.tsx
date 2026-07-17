"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAppReservations } from "@/lib/hooks/useAppReservations";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 사장님 멘탈모델 기준 5개 그룹 — 하위 이동은 각 페이지 상단 SubTabs가 담당
const navItems = [
  { label: "📊 오늘", slug: "", match: [""] },
  { label: "📅 예약", slug: "reservations", match: ["reservations"] },
  { label: "🔥 핫딜", slug: "offers/rules", match: ["offers/rules", "offers/benefits", "offers/simulator"] },
  { label: "🤖 분석", slug: "offers/ai", match: ["offers/ai", "insights"] },
  { label: "🏪 가게 관리", slug: "menus", match: ["menus", "tables", "capacity", "settings"] },
];

export function SidebarNav({
  storeId,
  onNavigate,
}: {
  storeId: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const params = useParams<{ storeId?: string }>();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null"
      ? storeId
      : params?.storeId ?? null;

  // 대기 중(확정 전) 앱 예약 수 → '예약' 메뉴 뱃지
  const { data: appReservations = [] } = useAppReservations(resolvedStoreId ?? undefined);
  const pendingCount = appReservations.filter(
    (r) => r.status === "confirmed" && r.date >= todayStr()
  ).length;

  return (
    <nav className="flex h-full flex-col gap-4 p-6">
      <div className="text-lg font-bold text-brand">랑데부</div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {"사장님 컨솔"}
      </div>
      <div className="mt-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const href = resolvedStoreId
            ? item.slug
              ? `/stores/${resolvedStoreId}/${item.slug}`
              : `/stores/${resolvedStoreId}`
            : "/stores/select";
          const base = resolvedStoreId ? `/stores/${resolvedStoreId}` : "";
          const isActive = base
            ? item.match.some((m) =>
                m === ""
                  ? pathname === base
                  : pathname === `${base}/${m}` || pathname.startsWith(`${base}/${m}/`)
              )
            : pathname === href;
          return (
            <Link
              key={item.label}
              href={href}
              onClick={onNavigate}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-brand text-white"
                  : "text-slate-600 hover:bg-brand-light"
              )}
            >
              <span>{item.label}</span>
              {item.slug === "reservations" && pendingCount > 0 && (
                <span
                  className={cn(
                    "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                    isActive ? "bg-white text-brand" : "bg-rose-500 text-white"
                  )}
                >
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
