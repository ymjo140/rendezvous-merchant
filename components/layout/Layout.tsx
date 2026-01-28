"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Topbar } from "@/components/layout/Topbar";
import { StoreSwitcher } from "@/components/layout/StoreSwitcher";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

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

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="text-sm font-semibold">\uBA54\uB274</div>
            <button
              className="text-sm text-slate-500"
              onClick={() => setMobileOpen(false)}
            >
              \uB2EB\uAE30
            </button>
          </div>
          <SidebarNav storeId={storeId} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)}>
          <StoreSwitcher currentStoreId={storeId} />
        </Topbar>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
