"use client";

import { ReactNode } from "react";

export function Sheet({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
        aria-label="메뉴 닫기"
      />
      {children}
    </div>
  );
}

export function SheetContent({ children }: { children: ReactNode }) {
  return (
    <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
      {children}
    </div>
  );
}
