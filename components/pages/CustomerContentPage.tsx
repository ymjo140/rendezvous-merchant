"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchWithAuth } from "@/lib/api/client";
import { toast } from "@/components/ui/toaster";

type Content = {
  hero_image: string | null;
  counts: { photos: number; reviews: number; curators: number; visitors: number };
  photos: { post_id: string; image: string; user_name: string; content: string }[];
  reviews: { id: number; rating: number | null; comment: string; image: string | null }[];
  best_review: { id: number; rating: number | null; comment: string; image: string | null } | null;
  curators: { folder_id: number; name: string; owner: string; likes: number }[];
};

export function CustomerContentPage({ storeId }: { storeId?: string }) {
  const [data, setData] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [heroImg, setHeroImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!storeId) return;
    setLoading(true);
    fetchWithAuth<Content>(`/api/merchant/stores/${storeId}/content`)
      .then((d) => {
        setData(d);
        setHeroImg(d.hero_image);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, [storeId]);

  const setHero = async () => {
    if (!storeId || !selected) return;
    setSaving(true);
    try {
      await fetchWithAuth(`/api/merchant/stores/${storeId}/hero-image`, {
        method: "POST",
        body: JSON.stringify({ image: selected }),
      });
      setHeroImg(selected);
      toast("대표 이미지로 지정했어요! 손님 앱 상세에 노출됩니다.", "success");
    } catch {
      toast("지정에 실패했어요.", "error");
    } finally {
      setSaving(false);
    }
  };

  const makePoster = () => {
    const r = data?.best_review;
    const img = selected || heroImg || data?.photos?.[0]?.image;
    if (!img) {
      toast("사진을 먼저 선택해주세요.", "info");
      return;
    }
    drawPoster(img, r?.rating ?? null, r?.comment ?? "");
  };

  if (loading)
    return <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>;

  const d = data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">손님 콘텐츠</h1>
        <p className="text-sm text-slate-500">손님이 올린 사진·후기를 가게 홍보에 바로 쓰세요 — 직접 안 찍어도 돼요</p>
      </div>

      {/* 지표 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MiniStat label="📷 손님 사진" value={`${d?.counts.photos ?? 0}장`} />
        <MiniStat label="✍️ 후기" value={`${d?.counts.reviews ?? 0}개`} />
        <MiniStat label="🔖 큐레이터 편입" value={`${d?.counts.curators ?? 0}명`} />
        <MiniStat label="✅ 방문 인증" value={`${d?.counts.visitors ?? 0}명`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        {/* 손님 사진 모음 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">손님이 올린 사진</div>
              <span className="text-xs text-slate-400">사진 눌러 선택 → 아래 실행</span>
            </div>
            {(d?.photos?.length ?? 0) === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                아직 손님 사진이 없어요.<br />손님이 게시물에 사진을 올리면 여기 모여요.
              </p>
            ) : (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {d!.photos.map((p) => {
                  const on = selected === p.image;
                  const isHero = heroImg === p.image;
                  return (
                    <button
                      key={p.post_id}
                      onClick={() => setSelected(on ? null : p.image)}
                      className={`relative aspect-square overflow-hidden rounded-lg ${
                        on ? "outline outline-2 outline-brand outline-offset-1" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" className="h-full w-full object-cover" />
                      {on && (
                        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] text-white">
                          ✓
                        </span>
                      )}
                      {isHero && (
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                          대표
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {(d?.photos?.length ?? 0) > 0 && (
              <>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={setHero}
                    disabled={!selected || saving}
                    className="h-10 flex-1 rounded-lg bg-brand text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
                  >
                    ⭐ 대표 이미지로
                  </button>
                  <button
                    onClick={makePoster}
                    disabled={!selected}
                    className="h-10 flex-1 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                  >
                    ✨ 홍보물 만들기
                  </button>
                </div>
                <div className="mt-2 flex items-start gap-1.5 text-[10.5px] text-slate-400">
                  <span>🔒</span>
                  <span>앱 안 노출은 바로 가능 · 인스타 등 외부 사용은 손님 동의를 받은 사진만 표시돼요</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* 홍보물 미리보기(베스트 후기) */}
          {d?.best_review && (
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 text-xs text-slate-500">홍보물 소재 · 베스트 후기</div>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {(selected || heroImg || d.photos?.[0]?.image) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected || heroImg || d.photos[0].image}
                      alt=""
                      className="h-24 w-full object-cover"
                    />
                  )}
                  <div className="p-3">
                    <div className="text-xs text-amber-600">
                      {"★".repeat(Math.round(d.best_review.rating ?? 5))}{" "}
                      <span className="font-semibold text-slate-700">{(d.best_review.rating ?? 0).toFixed(1)}</span>
                    </div>
                    <div className="mt-1 text-[13px] text-slate-800">&ldquo;{d.best_review.comment}&rdquo;</div>
                  </div>
                </div>
                <button
                  onClick={makePoster}
                  className="mt-2.5 h-9 w-full rounded-lg bg-brand text-xs font-semibold text-white hover:bg-brand-dark"
                >
                  ⬇️ 이미지 저장
                </button>
              </CardContent>
            </Card>
          )}

          {/* 이번 주 하이라이트 */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 text-xs text-slate-500">이번 주 하이라이트</div>
              {(d?.curators?.length ?? 0) === 0 && !d?.best_review ? (
                <p className="py-4 text-center text-xs text-slate-400">아직 하이라이트가 없어요.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {d?.curators?.map((c) => (
                    <div key={c.folder_id} className="flex items-start gap-2 py-2 text-xs text-slate-700">
                      <span>🔖</span>
                      <span>
                        <b>{c.owner}</b>님이 &lsquo;{c.name}&rsquo;에 담았어요
                        {c.likes > 0 && <span className="text-slate-400"> · 추천 {c.likes}</span>}
                      </span>
                    </div>
                  ))}
                  {d?.best_review && (
                    <div className="flex items-start gap-2 py-2 text-xs text-slate-700">
                      <span>💬</span>
                      <span>
                        <b>베스트 후기</b> 1건 · 홍보물로 만들기 좋아요
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// 캔버스로 홍보물 카드 생성 → 다운로드
function drawPoster(imgUrl: string, rating: number | null, comment: string) {
  const W = 800;
  const H = 1000;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    // 이미지 상단 크롭
    const ratio = Math.max(W / img.width, (H * 0.62) / img.height);
    const iw = img.width * ratio;
    const ih = img.height * ratio;
    ctx.drawImage(img, (W - iw) / 2, 0, iw, ih);
    // 하단 흰 패널
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
    // 별점
    ctx.fillStyle = "#F5A623";
    ctx.font = "48px sans-serif";
    ctx.fillText("★".repeat(Math.round(rating ?? 5)), 48, H * 0.62 + 80);
    // 후기
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 40px sans-serif";
    wrapText(ctx, `"${comment}"`, 48, H * 0.62 + 160, W - 96, 54);
    // 워터마크
    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px sans-serif";
    ctx.fillText("랑데부 · 손님 후기", 48, H - 48);
    // 다운로드
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "rendezvous-poster.png";
    a.click();
  };
  img.onerror = () => {
    // 크로스오리진 실패 시 원본만 저장
    const a = document.createElement("a");
    a.href = imgUrl;
    a.download = "photo.png";
    a.click();
  };
  img.src = imgUrl;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number
) {
  const chars = text.split("");
  let line = "";
  let yy = y;
  for (const ch of chars) {
    if (ctx.measureText(line + ch).width > maxW) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lineH;
    } else {
      line += ch;
    }
  }
  ctx.fillText(line, x, yy);
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
}
