import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  // 모바일: 컬럼이 많은 표는 컨테이너 안에서 가로 스크롤(페이지 전체가 밀리지 않게)
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full min-w-[560px] text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn("border-b border-slate-200 pb-2 text-xs font-semibold text-slate-500", className)}
      {...props}
    />
  );
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("border-b border-slate-100 py-3 text-slate-700", className)}
      {...props}
    />
  );
}


