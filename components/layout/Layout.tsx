"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Topbar } from "@/components/layout/Topbar";
import { StoreSwitcher } from "@/components/layout/StoreSwitcher";

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const storeId = useMemo(() => {
    const match = pathname.match(/\/stores\/([^/]+)/);
    return match ? match[1] : null;
  }, [pathname]);

  useEffect(() => {
    const isSelect = pathname.startsWith("/stores/select");
    const isOnboarding = pathname.startsWith("/onboarding");
    if (!storeId && !isSelect && !isOnboarding) {
      router.replace("/stores/select");
    }
  }, [storeId, pathname, router]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarNav storeId={storeId} />
      </aside>
      <div className="flex flex-1 flex-col">
        <Topbar>
          <StoreSwitcher currentStoreId={storeId} />
        </Topbar>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}


