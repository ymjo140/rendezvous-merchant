"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logAction } from "@/lib/analytics/analyticsClient";
import { actionMap } from "@/domain/analytics/actionMap";

export function LoginPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Rendezvous Merchant</h1>
        <p className="mt-2 text-sm text-slate-500">
          카카오 계정으로 로그인하고 매장 관리 콘솔에 접속하세요.
        </p>
        <Button
          className="mt-6 w-full"
          onClick={async () => {
            try {
              await logAction({ action_type: actionMap.login_click });
            } catch {
              // ignore logging failures in dev
            }
            router.push("/auth/callback/kakao?code=dev-kakao");
          }}
        >
          카카오 로그인
        </Button>
      </div>
    </div>
  );
}


