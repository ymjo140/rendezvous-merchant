"use client";

// 🏪 가게 관리 허브 v2 — 4개 대형 카드(기본 정보/메뉴/좌석·테이블/체크인 QR)가 본체.
// 입점 완성도는 슬림 한 줄(펼치면 남은 항목), 👀 손님 앱 미리보기로 저장 결과 확인.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { toPng } from "html-to-image";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";
import { useMenus } from "@/lib/hooks/useMenus";
import { useStoreTables } from "@/lib/hooks/useStoreTables";
import { useTableUnits } from "@/lib/hooks/useTableUnits";
import { useStoreId } from "@/components/layout/Layout";

type PlaceInfo = {
  name: string; cuisine_type: string; phone: string; address: string;
  hero_image: string | null; vibe_tags: string[];
  hours: { open?: string; close?: string; break_from?: string; break_to?: string; break_days?: string } | null;
};

export function StoreManagePage({ storeId }: { storeId?: string }) {
  const router = useRouter();
  const contextStoreId = useStoreId();
  const resolvedStoreId =
    storeId && storeId !== "undefined" && storeId !== "null" ? storeId : contextStoreId ?? undefined;
  const placeId = Number(resolvedStoreId);

  const [info, setInfo] = useState<PlaceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkOpen, setCheckOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const { data: menus = [] } = useMenus(resolvedStoreId);
  const { data: storeTables = [] } = useStoreTables(resolvedStoreId);
  const { data: units = [] } = useTableUnits(resolvedStoreId);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!Number.isFinite(placeId)) { setLoading(false); return; }
      const { data } = await supabase
        .from("places")
        .select("name, cuisine_type, category, phone, address, hero_image, vibe_tags, features")
        .eq("id", placeId)
        .maybeSingle();
      if (!active) return;
      if (data) {
        const feats = (data.features && typeof data.features === "object" ? data.features : {}) as Record<string, any>;
        setInfo({
          name: data.name ?? "",
          cuisine_type: data.cuisine_type ?? data.category ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          hero_image: data.hero_image ?? null,
          vibe_tags: Array.isArray(data.vibe_tags) ? data.vibe_tags : [],
          hours: feats.hours && typeof feats.hours === "object" ? feats.hours : null,
        });
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [placeId]);

  // 좌석 집계 — 테이블 맵 우선, 없으면 수용량
  const seatInfo = useMemo(() => {
    if (storeTables.length > 0) {
      return {
        seats: storeTables.reduce((a, t) => a + (t.capacity || 0), 0),
        tables: storeTables.length,
        source: "map" as const,
      };
    }
    return {
      seats: units.reduce((a, u) => a + (u.max_capacity || 0) * (u.quantity || 0), 0),
      tables: units.reduce((a, u) => a + (u.quantity || 0), 0),
      source: units.length > 0 ? ("units" as const) : ("none" as const),
    };
  }, [storeTables, units]);

  const recommended = menus.filter((m: any) => m.is_recommended);
  const withPhoto = menus.filter((m: any) => m.image_url).length;

  // 입점 완성도 — 6개 항목
  const checks = useMemo(() => {
    const i = info;
    return [
      { key: "basic", label: "기본 정보 (이름·전화·주소)", ok: !!(i?.name && i?.phone && i?.address), go: "settings" },
      { key: "hours", label: "영업·브레이크 시간", ok: !!i?.hours?.open, go: "reservations" },
      { key: "menu", label: "메뉴 3개 이상", ok: menus.length >= 3, go: "menus" },
      { key: "hero", label: "대표 사진", ok: !!i?.hero_image, go: "content" },
      { key: "tags", label: "분위기 태그 3개 이상", ok: (i?.vibe_tags?.length ?? 0) >= 3, go: "settings" },
      { key: "seats", label: "좌석·테이블 등록", ok: seatInfo.source !== "none", go: "tables" },
    ];
  }, [info, menus.length, seatInfo.source]);
  const doneCount = checks.filter((c) => c.ok).length;
  const pct = Math.round((doneCount / checks.length) * 100);
  const missing = checks.filter((c) => !c.ok);

  const qrValue = useMemo(() => `https://rendezvous.app/checkin/${resolvedStoreId}`, [resolvedStoreId]);
  const downloadQr = async () => {
    if (!qrRef.current) return;
    try {
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `rendezvous_checkin_${resolvedStoreId}.png`;
      link.href = dataUrl;
      link.click();
      toast("QR 이미지를 저장했어요 — 테이블·계산대에 붙여주세요.", "success");
    } catch {
      toast("이미지 저장에 실패했어요.", "error");
    }
  };

  const go = (slug: string) => router.push(`/stores/${resolvedStoreId}/${slug}`);

  if (loading)
    return (
      <div className="-m-4 min-h-full bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
        <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>
      </div>
    );

  const hoursText = info?.hours?.open ? `${info.hours.open}–${info.hours.close}` : "미설정";
  const breakText = info?.hours?.break_from
    ? `${info.hours.break_from}–${info.hours.break_to}${info.hours.break_days === "weekday" ? " (평일)" : ""}`
    : "없음";

  return (
    <div className="-m-4 min-h-full space-y-3 bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
      {/* 헤더 */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900">가게 관리</h1>
          <p className="text-[11.5px] text-[#B49A6A]">여기서 채운 것이 손님 앱의 우리 가게가 돼요</p>
        </div>
        <button
          onClick={() => setPreviewOpen(true)}
          className="ml-auto rounded-xl bg-[#F5A623] px-4 py-2 text-[12px] font-bold text-white hover:bg-[#e09415]"
        >
          👀 손님 앱에서 보기
        </button>
      </div>

      {/* 입점 완성도 — 슬림 한 줄 */}
      <div className="rounded-xl border border-[#F0E6D2] bg-white px-3.5 py-2">
        <button onClick={() => setCheckOpen(!checkOpen)} className="flex w-full items-center gap-2.5">
          <span className="shrink-0 text-[11px] text-[#B49A6A]">입점 완성도</span>
          <div className="relative h-1.5 min-w-0 flex-1 overflow-hidden rounded bg-[#FAEEDA]">
            <div className="absolute inset-y-0 left-0 rounded bg-[#F5A623]" style={{ width: `${pct}%` }} />
          </div>
          <b className="shrink-0 text-[12px] font-bold text-[#854F0B]">{pct}%</b>
          {missing.length > 0 && (
            <span className="shrink-0 text-[10.5px] text-[#A32D2D]">남은 {missing.length}개 {checkOpen ? "▴" : "▾"}</span>
          )}
        </button>
        {checkOpen && missing.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-[#F5EBD8] pt-2">
            {missing.map((c) => (
              <button key={c.key} onClick={() => go(c.go)} className="flex w-full items-center gap-2 text-[11.5px]">
                <span className="text-[#E24B4A]">○</span>
                <span className="text-slate-600">{c.label}</span>
                <span className="ml-auto font-semibold text-[#B4791B]">채우러 가기 →</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 4개 대형 카드 ── */}
      <div className="space-y-2.5">
        {/* 🏪 기본 정보 */}
        <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <b className="text-[14px] font-bold text-slate-900">기본 정보</b>
            <button onClick={() => go("settings")} className="ml-auto rounded-lg border border-[#F0E6D2] px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:border-[#F5A623]">수정</button>
          </div>
          <div className="mt-2.5 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
            {[
              { l: "가게 이름", v: info?.name || "미입력" },
              { l: "카테고리", v: info?.cuisine_type || "미입력" },
              { l: "전화", v: info?.phone || "미입력" },
              { l: "주소", v: info?.address || "미입력" },
              { l: "영업", v: hoursText },
              { l: "브레이크", v: breakText, amber: breakText !== "없음" },
            ].map((r) => (
              <div key={r.l} className="flex items-center justify-between border-b border-[#FAF5E9] py-1.5 text-[12.5px] last:border-0 sm:[&:nth-last-child(2)]:border-0">
                <span className="text-slate-400">{r.l}</span>
                <b className={`ml-3 truncate font-semibold ${r.v === "미입력" || r.v === "미설정" ? "text-[#A32D2D]" : (r as any).amber ? "text-[#854F0B]" : "text-slate-800"}`}>{r.v}</b>
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-[#F5EBD8] pt-2.5">
            <span className="text-[11px] text-slate-400">분위기·시설</span>
            {(info?.vibe_tags ?? []).slice(0, 6).map((t) => (
              <span key={t} className="rounded-md bg-[#FAEEDA] px-2 py-0.5 text-[11px] text-[#854F0B]">#{t}</span>
            ))}
            {(info?.vibe_tags?.length ?? 0) < 3 && (
              <button onClick={() => go("settings")} className="rounded-md border border-dashed border-[#E0D5BC] px-2 py-0.5 text-[11px] text-[#B49A6A]">
                + 3개 이상이면 손님 필터에 잘 잡혀요
              </button>
            )}
          </div>
        </div>

        {/* 🍽️ 메뉴 */}
        <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍽️</span>
            <b className="text-[14px] font-bold text-slate-900">메뉴</b>
            <span className="text-[11px] text-[#B49A6A]">{menus.length}개 · 사진 {withPhoto}개</span>
            <button onClick={() => go("menus")} className="ml-auto rounded-lg border border-[#F0E6D2] px-3 py-1.5 text-[11.5px] font-semibold text-slate-600 hover:border-[#F5A623]">메뉴 관리</button>
          </div>
          {menus.length === 0 ? (
            <p className="mt-2.5 text-[12px] text-slate-400">아직 메뉴가 없어요 — 대표 메뉴 몇 개만 올려도 예약 전환이 올라가요.</p>
          ) : (
            <div className="mt-2">
              {(recommended.length > 0 ? recommended : menus).slice(0, menuOpen ? 20 : 3).map((m: any) => (
                <div key={String(m.id)} className="flex items-center justify-between border-b border-[#FAF5E9] py-1.5 text-[12.5px] last:border-0">
                  <span className="truncate text-slate-700">
                    {m.is_recommended && <em className="mr-1 rounded bg-[#FAEEDA] px-1 py-0.5 text-[9px] font-bold not-italic text-[#854F0B]">대표</em>}
                    {m.name}
                  </span>
                  <b className="ml-3 shrink-0 font-semibold text-slate-800">{m.price ? `${Number(m.price).toLocaleString()}원` : "—"}</b>
                </div>
              ))}
              {menus.length > 3 && (
                <button onClick={() => setMenuOpen(!menuOpen)} className="mt-1 text-[11px] text-[#B49A6A]">
                  {menuOpen ? "접기 ▴" : `${menus.length - Math.min(3, (recommended.length > 0 ? recommended : menus).length)}개 더 보기 ▾`}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 🪑 좌석 · 테이블 */}
        <div className={`rounded-2xl border bg-white p-4 ${seatInfo.source === "map" ? "border-[#F0E6D2]" : "border-[#F5A623]"}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg">🪑</span>
            <b className="text-[14px] font-bold text-slate-900">좌석 · 테이블</b>
            <span className="ml-auto">
              <button onClick={() => go("tables")} className="rounded-lg bg-[#F5A623] px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-[#e09415]">
                {seatInfo.source === "map" ? "테이블 맵" : "테이블 맵 그리기"}
              </button>
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-x-6">
            <div className="flex items-center justify-between py-1.5 text-[12.5px]">
              <span className="text-slate-400">총 좌석</span>
              <b className="font-semibold text-slate-800">{seatInfo.seats > 0 ? `${seatInfo.seats}석` : "미등록"}</b>
            </div>
            <div className="flex items-center justify-between py-1.5 text-[12.5px]">
              <span className="text-slate-400">테이블</span>
              <b className="font-semibold text-slate-800">{seatInfo.tables > 0 ? `${seatInfo.tables}개` : "—"}</b>
            </div>
          </div>
          {seatInfo.source !== "map" && (
            <div className="mt-1.5 rounded-lg bg-[#FFF9EC] px-3 py-2 text-[11.5px] text-[#854F0B]">
              ⚠ 테이블 맵 미등록 — 맵을 그리면 <b>예약판 배치·공실 감지가 실측</b>으로 바뀌어요{seatInfo.source === "units" ? " (지금은 예전 수용량 값 기준 대략치)" : ""}
            </div>
          )}
        </div>

        {/* 📥 체크인 QR */}
        <div className="rounded-2xl border border-[#F0E6D2] bg-white p-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📥</span>
            <b className="text-[14px] font-bold text-slate-900">체크인 QR</b>
            <button onClick={downloadQr} className="ml-auto rounded-lg bg-[#F5A623] px-3 py-1.5 text-[11.5px] font-bold text-white hover:bg-[#e09415]">다운로드</button>
          </div>
          <div className="mt-2.5 flex items-center gap-4">
            <div ref={qrRef} className="shrink-0 rounded-xl border border-[#F0E6D2] bg-white p-2">
              <QRCodeCanvas value={qrValue} size={72} />
            </div>
            <p className="text-[12px] leading-relaxed text-slate-600">
              테이블·계산대에 붙여두면<br />
              <b className="text-slate-800">방문 인증</b> (재방문 데이터의 시작) +{" "}
              <b className="text-[#854F0B]">우리 가게 단골 크루 가입</b> 입구가 돼요
            </p>
          </div>
        </div>
      </div>

      {/* 👀 손님 앱 미리보기 시트 */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreviewOpen(false)}>
          <div className="w-full max-w-[300px]" onClick={(e) => e.stopPropagation()}>
            <div className="overflow-hidden rounded-3xl border border-[#F0E6D2] bg-white">
              <div className="relative flex h-32 items-center justify-center bg-[#FCE3B8] text-5xl">
                {info?.hero_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={info.hero_image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <>
                    🍽️
                    <span className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[9px] text-white">
                      대표 사진 미지정 — 손님 콘텐츠에서 지정
                    </span>
                  </>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-baseline gap-1.5">
                  <b className="text-[15px] font-bold text-slate-900">{info?.name || "가게 이름"}</b>
                  <span className="text-[10.5px] text-[#B49A6A]">{info?.cuisine_type}</span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(info?.vibe_tags ?? []).slice(0, 4).map((t) => (
                    <span key={t} className="rounded bg-[#FAEEDA] px-1.5 py-0.5 text-[10px] text-[#854F0B]">#{t}</span>
                  ))}
                  {(info?.vibe_tags?.length ?? 0) < 3 && (
                    <span className="rounded border border-dashed border-[#E0D5BC] px-1.5 py-0.5 text-[10px] text-[#B49A6A]">+ 태그를 더 달면 필터에 잡혀요</span>
                  )}
                </div>
                <div className="mt-2 text-[11px] text-slate-500">
                  영업 {hoursText}{breakText !== "없음" && ` · 브레이크 ${breakText}`}
                </div>
                <div className="mt-2.5 border-t border-[#F5EBD8] pt-2.5">
                  <div className="text-[11px] font-semibold text-slate-600">대표 메뉴</div>
                  {(recommended.length > 0 ? recommended : menus).slice(0, 2).map((m: any) => (
                    <div key={String(m.id)} className="mt-1 flex justify-between text-[11.5px] text-slate-700">
                      <span>{m.name}</span>
                      <b className="font-semibold">{m.price ? `${Number(m.price).toLocaleString()}원` : ""}</b>
                    </div>
                  ))}
                  {menus.length === 0 && <p className="mt-1 text-[11px] text-[#A32D2D]">메뉴 미등록 — 비어 보여요</p>}
                </div>
                <div className="mt-3 rounded-xl bg-[#F5A623] py-2 text-center text-[12px] font-bold text-white">예약하기</div>
              </div>
            </div>
            <p className="mt-2 text-center text-[10.5px] text-white/90">손님 앱 상세 화면 미리보기 · 빈 곳이 그대로 보여요 (탭하면 닫기)</p>
          </div>
        </div>
      )}
    </div>
  );
}
