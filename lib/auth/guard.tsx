"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMe } from "@/lib/auth/useMe";
import { clearToken, getToken } from "@/lib/auth/tokenStore";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { me, loading, error } = useMe();
  const token = getToken();

  useEffect(() => {
    if (!token && pathname !== "/login") {
      router.replace("/login");
    }
  }, [token, pathname, router]);

  useEffect(() => {
    if (!loading && error && !me) {
      clearToken();
      router.replace("/login");
    }
  }, [loading, error, me, router]);

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        인증 확인 중...
      </div>
    );
  }

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        계정 정보를 불러올 수 없습니다.
      </div>
    );
  }

  return <>{children}</>;
}


