import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={cn(
            "rounded-md px-3 py-1 text-sm",
            active === tab
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}


