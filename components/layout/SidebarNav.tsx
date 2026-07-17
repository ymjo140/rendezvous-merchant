"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAppReservations } from "@/lib/hooks/useAppReservations";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// \uC0AC\uC7A5\uB2D8 \uBA58\uD0C8\uBAA8\uB378 \uAE30\uC900 5\uAC1C \uADF8\uB8F9 \u2014 \uD558\uC704 \uC774\uB3D9\uC740 \uAC01 \uD398\uC774\uC9C0 \uC0C1\uB2E8 SubTabs\uAC00 \uB2F4\uB2F9
const navItems = [
  { label: "\uD83D\uDCCA \uC624\uB298", slug: "", match: [""] },
  { label: "\uD83D\uDCC5 \uC608\uC57D", slug: "reservations", match: ["reservations"] },
  { label: "\uD83D\uDD25 \uD56B\uB51C", slug: "offers/rules", match: ["offers/rules", "offers/benefits", "offers/simulator"] },
  { label: "\uD83E\uDD16 \uBD84\uC11D", slug: "offers/ai", match: ["offers/ai", "insights"] },
  { label: "\uD83C\uDFEA \uAC00\uAC8C \uAD00\uB9AC", slug: "menus", match: ["menus", "tables", "capacity", "settings"] },
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
      <div className="text-lg font-bold text-brand">\uB791\uB370\uBD80</div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {"\uC0AC\uC7A5\uB2D8 \uCEE8\uC194"}
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
