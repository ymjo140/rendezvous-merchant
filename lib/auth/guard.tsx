"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth/tokenStore";

// 인증 게이트 — 토큰(Supabase 로그인 시 저장) 없으면 /login으로.
// (기존 useMe는 FastAPI 401 시 mock으로 항상 통과하던 무의미한 단계라 제거)
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = getToken();

  useEffect(() => {
    if (!token && pathname !== "/login") {
      router.replace("/login");
    }
  }, [token, pathname, router]);

  if (!token) {
    return null;
  }

  return <>{children}</>;
}
