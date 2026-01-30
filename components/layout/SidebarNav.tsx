"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { label: "\uB300\uC2DC\uBCF4\uB4DC", slug: "" },
  { label: "\uC608\uC57D", slug: "reservations" },
  { label: "\uB8F0 \uC124\uC815", slug: "offers/rules" },
  { label: "\uD61C\uD0DD \uCE74\uD0C8\uB85C\uADF8", slug: "offers/benefits" },
  { label: "\uB8F0 \uC2DC\uBBAC\uB808\uC774\uD130", slug: "offers/simulator" },
  { label: "\uC218\uC6A9\uB7C9", slug: "capacity" },
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

  return (
    <nav className="flex h-full flex-col gap-4 p-6">
      <div className="text-lg font-semibold">{"\uB80C\uB370\uBD80"}</div>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {"\uC0AC\uC7A5\uB2D8 \uCEE8\uC194"}
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
