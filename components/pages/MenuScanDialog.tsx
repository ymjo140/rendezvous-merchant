"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { fetchWithAuth } from "@/lib/api/client";

/** 메뉴판 사진 한 장으로 메뉴를 등록한다.
 *
 *  메뉴 30~80개를 손으로 치라는 건 사장님이 가장 하기 싫어하는 일이다. 배달앱은
 *  주문이 들어오니 그걸 시킬 수 있지만 우리는 아직 줄 게 없다. 그래서 촬영 한 번으로
 *  끝내되, **바로 저장하지 않는다** — 뽑아낸 목록을 화면에서 고칠 수 있게 하고,
 *  확인을 누를 때 저장한다. 잘못 읽은 걸 조용히 넣으면 손으로 지우게 되고 그러면
 *  손입력보다 나쁘다.
 *
 *  실측(2026-08-02): 실제 분식집 메뉴판 23개를 가격 오류 0으로 읽었다. 3회 반복 동일.
 */

type ScanItem = {
  name: string;
  price: number | null;
  section?: string | null;
  note?: string | null;
};

type Row = ScanItem & { keep: boolean; category: string };

const CATEGORIES = [
  { value: "MAIN", label: "메인" },
  { value: "SIDE", label: "사이드" },
  { value: "DRINK", label: "음료" },
];

/** 구역 이름으로 카테고리를 짐작한다. 틀리면 사장님이 고치면 된다. */
function guessCategory(item: ScanItem): string {
  const s = `${item.section ?? ""} ${item.name}`;
  if (/주류|음료|술|소주|맥주|막걸리|커피|에이드|사이다|콜라/.test(s)) return "DRINK";
  if (/사이드|추가|공기밥|밥|사리|토핑/.test(s)) return "SIDE";
  return "MAIN";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

export function MenuScanDialog({
  storeId,
  open,
  onClose,
  onSaved,
}: {
  storeId: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState<"scan" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);

  const reset = () => {
    setPreview(null);
    setRows(null);
    setError(null);
    setBusy(null);
    setReplace(false);
  };

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setError(null);
    if (file.size > 8 * 1024 * 1024) {
      setError("사진이 너무 큽니다. 8MB 이하로 올려주세요.");
      return;
    }
    setBusy("scan");
    try {
      const dataUrl = await fileToBase64(file);
      setPreview(dataUrl);
      const res = await fetchWithAuth<{ items: ScanItem[] }>(
        `/api/merchant/stores/${storeId}/menus/scan`,
        {
          method: "POST",
          body: JSON.stringify({ image_base64: dataUrl, mime_type: file.type || "image/jpeg" }),
        }
      );
      const items = res.items ?? [];
      if (items.length === 0) {
        setError("사진에서 메뉴를 찾지 못했습니다. 메뉴판이 잘 보이게 다시 찍어주세요.");
        setRows(null);
      } else {
        setRows(items.map((it) => ({ ...it, keep: true, category: guessCategory(it) })));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "사진을 읽지 못했습니다.");
    } finally {
      setBusy(null);
    }
  };

  const patch = (i: number, next: Partial<Row>) => {
    setRows((prev) => (prev ? prev.map((r, idx) => (idx === i ? { ...r, ...next } : r)) : prev));
  };

  const save = async () => {
    const picked = (rows ?? []).filter((r) => r.keep && r.name.trim());
    if (picked.length === 0) {
      setError("저장할 메뉴가 없습니다.");
      return;
    }
    setBusy("save");
    setError(null);
    try {
      await fetchWithAuth(`/api/merchant/stores/${storeId}/menus/bulk`, {
        method: "POST",
        body: JSON.stringify({
          items: picked.map((r) => ({ name: r.name.trim(), price: r.price, category: r.category })),
          replace,
        }),
      });
      onSaved();
      reset();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했습니다.");
      setBusy(null);
    }
  };

  const keepCount = (rows ?? []).filter((r) => r.keep).length;

  return (
    <Dialog open={open}>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{"메뉴판 사진으로 등록"}</h2>
        {!rows && (
          <>
            <p className="text-sm text-slate-600">
              {"벽에 붙은 메뉴판이나 메뉴책을 찍어서 올려주세요. 이름과 가격을 자동으로 채웁니다."}
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy === "scan"}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-sm text-slate-500 transition-colors hover:border-slate-400 disabled:opacity-60"
            >
              {busy === "scan" ? (
                <span>{"사진에서 메뉴를 읽는 중… (10초쯤 걸려요)"}</span>
              ) : (
                <>
                  <span className="text-2xl">{"📷"}</span>
                  <span className="font-medium text-slate-700">{"메뉴판 사진 올리기"}</span>
                  <span className="text-xs">{"JPG · PNG · 8MB 이하"}</span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </>
        )}

        {rows && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                {`${rows.length}개를 찾았어요. 틀린 건 고치고, 뺄 건 체크를 풀어주세요.`}
              </p>
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="h-12 w-16 rounded object-cover" />
              )}
            </div>

            <div className="max-h-[46vh] space-y-1.5 overflow-y-auto pr-1">
              {rows.map((r, i) => (
                <div
                  key={`${r.name}-${i}`}
                  className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                    r.keep ? "border-slate-200 bg-white" : "border-slate-100 bg-slate-50 opacity-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={r.keep}
                    onChange={(e) => patch(i, { keep: e.target.checked })}
                    className="h-4 w-4 shrink-0"
                  />
                  <Input
                    value={r.name}
                    onChange={(e) => patch(i, { name: e.target.value })}
                    className="h-8 flex-1 text-sm"
                  />
                  <Input
                    value={r.price ?? ""}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d]/g, "");
                      patch(i, { price: v ? Number(v) : null });
                    }}
                    placeholder="가격"
                    className="h-8 w-24 text-right text-sm"
                  />
                  <select
                    value={r.category}
                    onChange={(e) => patch(i, { category: e.target.value })}
                    className="h-8 rounded-md border border-slate-200 bg-white px-1.5 text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {r.note && (
                    <span className="w-16 shrink-0 truncate text-[11px] text-slate-400" title={r.note}>
                      {r.note}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={replace}
                onChange={(e) => setReplace(e.target.checked)}
                className="h-4 w-4"
              />
              {"기존 메뉴를 모두 지우고 새로 등록"}
            </label>
          </>
        )}

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex justify-end gap-2">
          {rows && (
            <Button variant="secondary" onClick={reset} disabled={busy !== null}>
              {"다시 찍기"}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              reset();
              onClose();
            }}
            disabled={busy !== null}
          >
            {"닫기"}
          </Button>
          {rows && (
            <Button onClick={save} disabled={busy !== null || keepCount === 0}>
              {busy === "save" ? "저장 중…" : `${keepCount}개 등록`}
            </Button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
