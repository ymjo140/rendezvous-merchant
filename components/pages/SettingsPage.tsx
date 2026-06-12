"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";

// 손님 앱(B2C) 장소 상세가 그대로 읽는 필드들 — 여기서 수정하면 앱에 바로 반영됨.
type StoreInfo = {
  name: string;
  cuisine_type: string;
  phone: string;
  business_hours: string;
  address: string;
  price_range: string;
  external_link: string;
};

const EMPTY: StoreInfo = {
  name: "",
  cuisine_type: "",
  phone: "",
  business_hours: "",
  address: "",
  price_range: "",
  external_link: "",
};

const PRICE_OPTIONS = ["", "저렴", "보통", "고급"];

const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function SettingsPage({ storeId }: { storeId?: string }) {
  const resolvedStoreId = storeId ?? "1";
  const placeId = Number(resolvedStoreId);

  const [info, setInfo] = useState<StoreInfo>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [color, setColor] = useState<"black" | "blue">("black");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!isSupabaseConfigured || !Number.isFinite(placeId)) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("places")
        .select("name, cuisine_type, category, phone, business_hours, address, price_range, external_link")
        .eq("id", placeId)
        .maybeSingle();
      if (!active) return;
      if (!error && data) {
        setInfo({
          name: data.name ?? "",
          cuisine_type: data.cuisine_type ?? data.category ?? "",
          phone: data.phone ?? "",
          business_hours: data.business_hours ?? "",
          address: data.address ?? "",
          price_range: data.price_range ?? "",
          external_link: data.external_link ?? "",
        });
      }
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [placeId]);

  const set = (key: keyof StoreInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setInfo((prev) => ({ ...prev, [key]: e.target.value }));

  async function handleSave() {
    if (!isSupabaseConfigured || !Number.isFinite(placeId)) return;
    if (!info.name.trim()) {
      toast("가게 이름을 입력해주세요.", "error");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("places")
      .update({
        name: info.name.trim(),
        cuisine_type: info.cuisine_type.trim() || null,
        phone: info.phone.trim() || null,
        business_hours: info.business_hours.trim() || null,
        address: info.address.trim() || null,
        price_range: info.price_range || null,
        external_link: info.external_link.trim() || null,
      })
      .eq("id", placeId);
    setSaving(false);
    if (error) {
      toast("저장에 실패했어요. 잠시 후 다시 시도해주세요.", "error");
      return;
    }
    toast("저장 완료! 손님 앱에 바로 반영됩니다.", "success");
  }

  const qrValue = useMemo(
    () => `https://rendezvous.app/checkin/${resolvedStoreId}`,
    [resolvedStoreId]
  );

  async function handleDownload() {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `rendezvous_checkin_${resolvedStoreId}.png`;
      link.href = dataUrl;
      link.click();
      toast("QR 이미지가 저장되었습니다.", "success");
    } catch {
      toast("이미지 저장에 실패했습니다.", "error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">설정</h1>
        <p className="text-sm text-slate-500">
          매장 정보를 관리합니다. 저장하면 손님 앱(랑데부)에 바로 반영돼요.
        </p>
      </div>

      {/* 가게 정보 — B2C 장소 상세에 그대로 노출되는 필드 */}
      <Card>
        <CardHeader>
          <CardTitle>🏪 가게 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="py-4 text-sm text-slate-400">불러오는 중...</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="가게 이름 *">
                  <Input value={info.name} onChange={set("name")} placeholder="예: 랑데부 포차" />
                </Field>
                <Field label="업종/카테고리">
                  <Input value={info.cuisine_type} onChange={set("cuisine_type")} placeholder="예: 한식, 카페, 이자카야" />
                </Field>
                <Field label="전화번호">
                  <Input value={info.phone} onChange={set("phone")} placeholder="예: 02-1234-5678" />
                </Field>
                <Field label="영업시간">
                  <Input value={info.business_hours} onChange={set("business_hours")} placeholder="예: 11:00 - 22:00 (월 휴무)" />
                </Field>
                <Field label="주소">
                  <Input value={info.address} onChange={set("address")} placeholder="예: 서울 성북구 안암로 12" />
                </Field>
                <Field label="가격대">
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={info.price_range}
                    onChange={(e) => setInfo((p) => ({ ...p, price_range: e.target.value }))}
                  >
                    {PRICE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "선택 안 함"}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="예약/홈페이지 링크 (선택)">
                <Input value={info.external_link} onChange={set("external_link")} placeholder="https://..." />
              </Field>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-dark px-6">
                  {saving ? "저장 중..." : "저장하기"}
                </Button>
              </div>
              <p className="text-xs text-slate-400">
                💡 메뉴는 <b>메뉴 관리</b>에서, 핫딜은 <b>룰 설정</b>에서 관리해요. 모두 손님 앱에 연동됩니다.
              </p>
            </>
          )}
        </CardContent>
      </Card>

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
              <div className="text-sm font-medium">{info.name || "내 매장"}</div>
              <div className="text-xs text-slate-400">{qrValue}</div>
            </div>
            <Button onClick={handleDownload}>이미지로 저장</Button>
            <div className="text-xs text-slate-500">
              💡 별도의 리더기가 필요 없습니다. 손님 스마트폰 카메라로 찍으면 방문 인증이 완료됩니다.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
