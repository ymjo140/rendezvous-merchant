"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "Home", slug: "" },
  { label: "Reservations", slug: "reservations" },
  { label: "Offer Rules", slug: "offers/rules" },
  { label: "Benefits Catalog", slug: "offers/benefits" },
  { label: "Rule Simulator", slug: "offers/simulator" },
  { label: "Capacity", slug: "capacity" },
  { label: "Insights", slug: "insights" },
  { label: "Settings", slug: "settings" },
];

export function SidebarNav({ storeId }: { storeId: string | null }) {
  const pathname = usePathname();
  return (
    <nav className="flex h-full flex-col gap-4 p-6">
      <div className="text-lg font-semibold">Rendezvous</div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        Merchant Console
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


