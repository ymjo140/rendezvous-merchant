import * as React from "react";

export function Accordion({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="rounded-md border border-slate-200 bg-white p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-700">
        {title}
      </summary>
      <div className="mt-2 text-sm text-slate-600">{children}</div>
    </details>
  );
}


