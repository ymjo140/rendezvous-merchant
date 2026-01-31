"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logAction } from "@/lib/analytics/analyticsClient";
import { actionMap } from "@/domain/analytics/actionMap";
import { supabase } from "@/lib/supabase/client";

const DEV_EMAIL = "dev@rendezvous.app";

export function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDevLogin() {
    if (!password.trim()) {
      window.alert("\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD574 \uC8FC\uC138\uC694.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: DEV_EMAIL,
        password: password.trim(),
      });

      if (error || !data?.user) {
        window.alert("\uB85C\uADF8\uC778 \uC2E4\uD328: dev@rendezvous.app \uACC4\uC815\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
        return;
      }

      const { data: store, error: storeError } = await supabase
        .from("places")
        .select("id")
        .eq("owner_id", data.user.id)
        .single();

      if (storeError || !store?.id) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("rendezvous_last_store");
        }
        router.push("/onboarding");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem("rendezvous_last_store", String(store.id));
      }
      router.push(`/stores/${store.id}`);
    } catch {
      window.alert("\uB85C\uADF8\uC778 \uC2E4\uD328: dev@rendezvous.app \uACC4\uC815\uC744 \uD655\uC778\uD574\uC8FC\uC138\uC694.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          {"\uB80C\uB370\uBD80 \uC0AC\uC7A5\uB2D8 \uCEE8\uC194"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {
            "\uCE74\uCE74\uC624 \uACC4\uC815\uC73C\uB85C \uB85C\uADF8\uC778\uD558\uACE0 \uB9E4\uC7A5 \uAD00\uB9AC \uCEE8\uC194\uC5D0 \uC811\uC18D\uD558\uC138\uC694."
          }
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
          {"\uCE74\uCE74\uC624 \uB85C\uADF8\uC778"}
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <div className="h-px flex-1 bg-slate-200" />
          <span>{"\uB610\uB294"}</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-700">
            {"\uD83D\uDD27 \uAC1C\uBC1C\uC790\uC6A9 \uB9C8\uC2A4\uD130\uD0A4"}
          </div>
          <Input
            type="password"
            placeholder="Master Key"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Button className="w-full" onClick={handleDevLogin} disabled={loading}>
            {loading ? "\uB85C\uADF8\uC778 \uC911..." : "\uD83D\uDE80 \uC989\uC2DC \uC9C4\uC785"}
          </Button>
        </div>
      </div>
    </div>
  );
}
