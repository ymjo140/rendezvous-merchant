"use client";

import { useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SettingsPage({ storeId }: { storeId?: string }) {
  const resolvedStoreId = storeId ?? "1";
  const storeName = "데모 스토어";
  const [color, setColor] = useState<"black" | "blue">("black");
  const qrRef = useRef<HTMLDivElement>(null);

  const qrValue = useMemo(
    () => `https://rendezvous.app/checkin/${resolvedStoreId}`,
    [resolvedStoreId]
  );

  async function handleDownload() {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement("a");
      link.download = `rendezvous_checkin_${resolvedStoreId}.png`;
      link.href = dataUrl;
      link.click();
      window.alert(
        "이미지가 저장되었습니다. 프린트해서 카운터나 테이블에 붙여주세요."
      );
    } catch {
      window.alert("이미지 저장에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">설정</h1>
        <p className="text-sm text-slate-500">
          매장 정보 및 계정 설정을 관리합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>📥 매장 체크인 QR 발급</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="font-medium">색상 선택</span>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="qrColor"
                value="black"
                checked={color === "black"}
                onChange={() => setColor("black")}
              />
              ⚫ 검정
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="qrColor"
                value="blue"
                checked={color === "blue"}
                onChange={() => setColor("blue")}
              />
              🔵 랑데부 블루
            </label>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div
              ref={qrRef}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4"
            >
              <QRCodeCanvas
                value={qrValue}
                size={200}
                bgColor="#ffffff"
                fgColor={color === "black" ? "#0f172a" : "#2563eb"}
                includeMargin
              />
              <div className="text-sm font-medium">{storeName}</div>
              <div className="text-xs text-slate-400">{qrValue}</div>
            </div>
            <Button onClick={handleDownload}>이미지로 저장</Button>
            <div className="text-xs text-slate-500">
              💡 별도의 리더기가 필요 없습니다. 손님 스마트폰 카메라로 찍으면 방문
              인증이 완료됩니다.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}