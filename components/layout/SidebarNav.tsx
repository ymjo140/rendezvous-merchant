"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { useAppReservations } from "@/lib/hooks/useAppReservations";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const navItems = [
  { label: "\uB300\uC2DC\uBCF4\uB4DC", slug: "" },
  { label: "AI \uC218\uC775\uC5D4\uC9C4", slug: "offers/ai" },
  { label: "\uC608\uC57D", slug: "reservations" },
  { label: "\uD14C\uC774\uBE14 \uB9F5", slug: "tables" },
  { label: "\uB8F0 \uC124\uC815", slug: "offers/rules" },
  { label: "\uD61C\uD0DD \uCE74\uD0C8\uB85C\uADF8", slug: "offers/benefits" },
  { label: "\uB8F0 \uC2DC\uBBAC\uB808\uC774\uD130", slug: "offers/simulator" },
  { label: "\uBA54\uB274 \uAD00\uB9AC", slug: "menus" },
  { label: "\uC778\uC0AC\uC774\uD2B8", slug: "insights" },
  { label: "\uC124\uC815", slug: "settings" },
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
          const isActive = pathname === href;
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
