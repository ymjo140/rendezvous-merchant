"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logAction } from "@/lib/analytics/analyticsClient";
import { actionMap } from "@/domain/analytics/actionMap";
import { setToken } from "@/lib/auth/tokenStore";

const MASTER_KEY = "dev1234";

export function LoginPage() {
  const router = useRouter();
  const [masterKey, setMasterKey] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          렌데부 사장님 컨솔
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          카카오 계정으로 로그인하고 매장 관리 컨솔에 접속하세요.
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

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>또는</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700">
            🔧 개발자용 마스터키
          </div>
          <Input
            type="password"
            placeholder="Master Key"
            value={masterKey}
            onChange={(event) => setMasterKey(event.target.value)}
          />
          <Button
            className="w-full"
            onClick={() => {
              if (masterKey !== MASTER_KEY) {
                window.alert("마스터키가 올바르지 않습니다.");
                return;
              }
              setToken("master-token");
              router.push("/onboarding");
            }}
          >
            🚀 즉시 진입
          </Button>
        </div>
      </div>
    </div>
  );
}