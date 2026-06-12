"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** 새 앱 예약(user_reservations INSERT) 실시간 감지 → 토스트 + 브라우저 알림. */
export function NewReservationWatcher({ storeId }: { storeId: string | null }) {
  useEffect(() => {
    if (!storeId || !isSupabaseConfigured) return;
    const placeId = Number(storeId);
    if (!Number.isFinite(placeId)) return;

    const channel = supabase
      .channel(`new-resv-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_reservations",
          filter: `place_id=eq.${placeId}`,
        },
        (payload) => {
          const r = (payload.new ?? {}) as {
            date?: string;
            time?: string;
            party_size?: number;
            deposit_amount?: number;
          };
          const msg = `새 앱 예약 도착! ${r.date ?? ""} ${r.time ?? ""} · ${r.party_size ?? "?"}명${
            r.deposit_amount ? ` · 예약금 ${Number(r.deposit_amount).toLocaleString()}원` : ""
          }`;
          toast(msg, "success");
          // 브라우저 알림(허용된 경우만, 실패 무시)
          try {
            if ("Notification" in window && Notification.permission === "granted") {
              new Notification("랑데부 — 새 예약", { body: msg });
            }
          } catch {
            /* ignore */
          }
        }
      )
      .subscribe();

    // 첫 진입 시 알림 권한 1회 요청(거부해도 토스트는 동작)
    try {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch(() => undefined);
      }
    } catch {
      /* ignore */
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  return null;
}
