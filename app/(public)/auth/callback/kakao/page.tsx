"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeKakaoCode } from "@/lib/auth/kakao";
import { setToken } from "@/lib/auth/tokenStore";

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("카카오 인증 처리 중...");

  useEffect(() => {
    const code = searchParams.get("code");

    async function handle() {
      try {
        if (!code) {
          throw new Error("인증 코드가 없습니다.");
        }
        const result = await exchangeKakaoCode(code);
        if (!result.access_token) {
          throw new Error("no token");
        }
        setToken(result.access_token);
        router.replace("/stores/select");
      } catch {
        // 프로덕션: dev-token 폴백 금지 — 인증 코드 없이 진입하는 우회를 차단하고
        // 로그인 화면으로 회귀. 로컬(dev)에서는 편의상 dev-token 유지.
        if (process.env.NODE_ENV === "production") {
          setStatus("카카오 인증에 실패했어요. 로그인 화면으로 돌아갑니다.");
          router.replace("/?error=kakao");
          return;
        }
        setToken("dev-token");
        setStatus("개발용 토큰으로 로그인합니다.");
        router.replace("/stores/select");
      }
    }

    void handle();
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
        {status}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-600">
            카카오 인증 처리 중...
          </div>
        </div>
      }
    >
      <KakaoCallbackInner />
    </Suspense>
  );
}

