"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { exchangeKakaoCode } from "@/lib/auth/kakao";
import { setToken } from "@/lib/auth/tokenStore";

function KakaoCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("\uCE74\uCE74\uC624 \uC778\uC99D \uCC98\uB9AC \uC911...");

  useEffect(() => {
    const code = searchParams.get("code");

    async function handle() {
      try {
        if (!code) {
          throw new Error("\uC778\uC99D \uCF54\uB4DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.");
        }
        const result = await exchangeKakaoCode(code);
        setToken(result.access_token || "dev-token");
        router.replace("/stores/select");
      } catch {
        setToken("dev-token");
        setStatus("\uAC1C\uBC1C\uC6A9 \uD1A0\uD070\uC73C\uB85C \uB85C\uADF8\uC778\uD569\uB2C8\uB2E4.");
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
            \uCE74\uCE74\uC624 \uC778\uC99D \uCC98\uB9AC \uC911...
          </div>
        </div>
      }
    >
      <KakaoCallbackInner />
    </Suspense>
  );
}

