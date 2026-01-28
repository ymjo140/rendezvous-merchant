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
        <h1 className="text-2xl font-semibold text-slate-900">
          \uB80C\uB370\uBD80 \uC0AC\uC7A5\uB2D8 \uCEE8\uC194
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          \uCE74\uCE74\uC624 \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uACE0 \uB9E4\uC7A5 \uAD00\uB9AC \uCEE8\uC194\uC5D0 \uC811\uC18D\uD558\uC138\uC694.
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
          \uCE74\uCE74\uC624 \uB85C\uADF8\uC778
        </Button>
      </div>
    </div>
  );
}
