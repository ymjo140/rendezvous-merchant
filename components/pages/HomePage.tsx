"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const feedItems = [
  "\uBC29\uAE08 4\uBA85 \uADF8\uB8F9\uC774 [\uD3C9\uC77C \uC800\uB141 \uB8F0] \uC5D0 \uB9E4\uCE6D\uB418\uC5C8\uC2B5\uB2C8\uB2E4! \u26A1",
  "\uD604\uC7AC 2\uD300\uC774 \uC0AC\uC7A5\uB2D8\uC758 \uC81C\uC548\uC744 \uBCF4\uACE0 \uC788\uC2B5\uB2C8\uB2E4.",
  "\uBC29\uAE08 \uC608\uC57D \uD655\uC815\uC774 \uC644\uB8CC\uB418\uC5C8\uC2B5\uB2C8\uB2E4.",
];

export function HomePage({ storeId }: { storeId?: string }) {
  const [logs, setLogs] = useState<string[]>([feedItems[0]]);

  useEffect(() => {
    let index = 1;
    const timer = setInterval(() => {
      setLogs((prev) => [feedItems[index % feedItems.length], ...prev].slice(0, 4));
      index += 1;
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">\uB300\uC2DC\uBCF4\uB4DC</h1>
        <p className="text-sm text-slate-500">\uB9E4\uC7A5 #{storeId}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>\uC2E4\uC2DC\uAC04 \uB9E4\uCE6D \uD604\uD669</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          {logs.map((item, idx) => (
            <div key={`${item}-${idx}`} className="rounded-md bg-slate-50 px-3 py-2">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "\uC608\uC57D", value: "12" },
          { label: "\uD65C\uC131 \uB8F0", value: "4" },
          { label: "\uD61C\uD0DD \uC0AC\uC6A9", value: "23" },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle>{item.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-semibold">
              {item.value}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
