"use client";

import { ReactNode } from "react";

export function Topbar({
  children,
  onMenuClick,
}: {
  children?: ReactNode;
  onMenuClick?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 lg:hidden"
          onClick={onMenuClick}
          aria-label="메뉴 열기"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="text-sm text-slate-500">사장님 컨솔</div>
      </div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}
