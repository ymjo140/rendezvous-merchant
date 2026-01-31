"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{"\uC628\uBCF4\uB529"}</h1>
        <p className="text-sm text-slate-500">
          {
            "\uAC00\uAC8C \uC815\uBCF4\uB97C \uB4F1\uB85D\uD574\uC57C \uB9E4\uC7A5 \uCEE8\uC194\uC744 \uC0AC\uC6A9\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."
          }
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-600">
          {
            "\uD604\uC7AC \uACC4\uC815\uC5D0 \uB9E4\uC7A5\uC774 \uC5C6\uC5B4 \uC628\uBCF4\uB529 \uB2E8\uACC4\uB85C \uC774\uB3D9\uD569\uB2C8\uB2E4."
          }
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => router.push("/stores/select")}>
            {"\uB9E4\uC7A5 \uC120\uD0DD\uD558\uAE30"}
          </Button>
        </div>
      </div>
    </div>
  );
}
