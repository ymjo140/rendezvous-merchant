"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { Topbar } from "@/components/layout/Topbar";
import { StoreSwitcher } from "@/components/layout/StoreSwitcher";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const StoreIdContext = createContext<string | null>(null);

export function StoreIdProvider({
  storeId,
  children,
}: {
  storeId: string;
  children: React.ReactNode;
}) {
  return (
    <StoreIdContext.Provider value={storeId}>
      {children}
    </StoreIdContext.Provider>
  );
}

export function useStoreId() {
  return useContext(StoreIdContext);
}

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const contextStoreId = useContext(StoreIdContext);

  const storeId = useMemo(() => {
    if (contextStoreId) return contextStoreId;
    const match = pathname.match(/\/stores\/([^/]+)/);
    return match ? match[1] : null;
  }, [contextStoreId, pathname]);
  const normalizedStoreId = useMemo(() => {
    if (!storeId) return null;
    if (storeId === "undefined" || storeId === "null") return null;
    return storeId;
  }, [storeId]);

  useEffect(() => {
    const isSelect = pathname.startsWith("/stores/select");
    const isOnboarding = pathname.startsWith("/onboarding");
    if (normalizedStoreId) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("rendezvous_last_store", normalizedStoreId);
      }
      return;
    }
    if (isSelect || isOnboarding) return;
    if (typeof window !== "undefined") {
      const lastStore = window.localStorage.getItem("rendezvous_last_store");
      if (lastStore) {
        const nextPath = pathname.startsWith("/stores/")
          ? pathname.replace(/^\/stores\/[^/]+/, `/stores/${lastStore}`)
          : `/stores/${lastStore}`;
        router.replace(nextPath);
        return;
      }
    }
    router.replace("/stores/select");
  }, [normalizedStoreId, pathname, router]);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden w-64 border-r border-slate-200 bg-white lg:block">
        <SidebarNav storeId={normalizedStoreId} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent>
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <div className="text-sm font-semibold">{"\uBA54\uB274"}</div>
            <button
              className="text-sm text-slate-500"
              onClick={() => setMobileOpen(false)}
            >
              {"\uB2EB\uAE30"}
            </button>
          </div>
          <SidebarNav
            storeId={normalizedStoreId}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)}>
          <StoreSwitcher currentStoreId={normalizedStoreId} />
        </Topbar>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
