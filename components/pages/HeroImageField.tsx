"use client";

// 대표 사진 업로드(선택) — 손님 앱 카드의 얼굴이 된다.
// 지금 places 12만 5천 곳 전부 hero_image가 비어 있어, 카드가 업종 대표 이미지로
// 채워지고 "실제 가게 사진이 아닙니다"라고 적힌다. 한 장 올리면 그 문구가 사라진다.
//
// 필수가 아니다. 강제하면 가게 정보 저장 자체를 안 한다.

import { useRef, useState } from "react";
import { fetchWithAuth } from "@/lib/api/client";

/** DB에 base64로 들어가므로 긴 변을 900px로 줄여 용량을 잡는다(원본은 수 MB가 예사). */
async function shrink(file: File, max = 900, quality = 0.82): Promise<string> {
  const dataUrl = await new Promise<string>((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result));
    fr.onerror = () => rej(new Error("read"));
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error("decode"));
    im.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  cv.getContext("2d")?.drawImage(img, 0, 0, w, h);
  return cv.toDataURL("image/jpeg", quality);
}

export function HeroImageField({
  storeId, value, onChange,
}: { storeId?: string; value: string | null; onChange: (v: string | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async (image: string | null) => {
    if (!storeId) return;
    setBusy(true);
    setMsg(null);
    try {
      await fetchWithAuth(`/api/merchant/stores/${storeId}/hero-image`, {
        method: "POST",
        body: JSON.stringify({ image }),
      });
      onChange(image);
      setMsg(image ? "저장했어요. 손님 앱 카드에 바로 반영돼요." : "대표 사진을 지웠어요.");
    } catch {
      setMsg("저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  const pick = async (f?: File | null) => {
    if (!f) return;
    if (!/^image\//.test(f.type)) { setMsg("이미지 파일만 올릴 수 있어요."); return; }
    setBusy(true);
    try {
      await save(await shrink(f));
    } catch {
      setMsg("이미지를 처리하지 못했어요.");
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <span className="text-[13px] font-semibold text-slate-700">대표 사진</span>
        <span className="text-[11px] text-slate-400">선택 · 안 올려도 됩니다</span>
      </div>

      <div className="flex items-start gap-3">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-slate-400">없음</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] leading-relaxed text-slate-500">
            손님 앱에서 우리 가게 카드에 쓰입니다. 지금은 업종 대표 이미지가 대신 들어가고
            <b className="text-slate-700"> &ldquo;실제 가게 사진이 아닙니다&rdquo;</b>라고 표시돼요.
            한 장 올리면 그 문구가 사라집니다.
          </p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy || !storeId}
              className="rounded-xl bg-[#F5A623] px-3 py-2 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {busy ? "올리는 중…" : value ? "사진 바꾸기" : "사진 올리기"}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => save(null)}
                disabled={busy}
                className="rounded-xl border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-500 disabled:opacity-50"
              >
                지우기
              </button>
            )}
          </div>
          {msg && <p className="mt-1.5 text-[11.5px] text-slate-500">{msg}</p>}
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }}
      />
    </div>
  );
}
