import { ReactNode } from "react";

export function Topbar({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
      <div className="text-sm text-slate-500">Merchant Console</div>
      <div className="flex items-center gap-3">{children}</div>
    </div>
  );
}


