"use client";

import { useEffect, useState } from "react";

// 경량 토스트 — 외부 라이브러리 없이 window 이벤트로 동작.
// 사용: toast("저장 완료!", "success") / Layout에 <Toaster /> 1회 마운트.

export type ToastType = "info" | "success" | "error";

type ToastItem = {
  id: number;
  message: string;
  type: ToastType;
};

export function toast(message: string, type: ToastType = "info") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("merchant:toast", { detail: { message, type } })
  );
}

const TYPE_STYLE: Record<ToastType, string> = {
  info: "border-slate-200 bg-white text-slate-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  error: "border-rose-200 bg-rose-50 text-rose-700",
};

const TYPE_ICON: Record<ToastType, string> = {
  info: "🔔",
  success: "✅",
  error: "⚠️",
};

let seq = 1;

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { message: string; type?: ToastType };
      if (!detail?.message) return;
      const item: ToastItem = { id: seq++, message: detail.message, type: detail.type ?? "info" };
      setItems((prev) => [...prev, item].slice(-4));
      setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== item.id));
      }, 3500);
    };
    window.addEventListener("merchant:toast", handler);
    return () => window.removeEventListener("merchant:toast", handler);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-lg ${TYPE_STYLE[t.type]}`}
        >
          <span>{TYPE_ICON[t.type]}</span>
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
