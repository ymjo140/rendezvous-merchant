"use client";

// 📷 손님 콘텐츠 v2 — 사진·홍보물/후기/담긴 리스트 3서브탭 (크림+앰버)
// 사진·홍보물: 선택하면 하단 고정 액션바(썸네일+후기 조합+대표/홍보물) — "고르면 바로 쓴다"
// 후기: 전체 목록+필터, 후기별 "이 후기로 홍보물" / 담긴 리스트: 신뢰 자산 카드
// 백엔드는 기존 content API (+curators에 icon/is_crew/saves 추가됨).

import { useMemo, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/api/client";
import { toast } from "@/components/ui/toaster";

type Review = { id: number; rating: number | null; comment: string; image: string | null };
type Curator = { folder_id: number; name: string; icon?: string; owner: string; is_crew?: boolean; likes: number; saves?: number };
type Content = {
  hero_image: string | null;
  counts: { photos: number; reviews: number; curators: number; visitors: number };
  photos: { post_id: string; image: string; user_name: string; content: string }[];
  reviews: Review[];
  best_review: Review | null;
  curators: Curator[];
};

type Tab = "photos" | "reviews" | "lists";
type ReviewFilter = "all" | "high" | "photo";

export function CustomerContentPage({ storeId }: { storeId?: string }) {
  const [tab, setTab] = useState<Tab>("photos");
  const [data, setData] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [heroImg, setHeroImg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [posterReview, setPosterReview] = useState<Review | null>(null); // 홍보물에 조합할 후기
  const [reviewPick, setReviewPick] = useState(false); // 후기 바꾸기 시트
  const [rFilter, setRFilter] = useState<ReviewFilter>("all");

  const load = () => {
    if (!storeId) return;
    setLoading(true);
    fetchWithAuth<Content>(`/api/merchant/stores/${storeId}/content`)
      .then((d) => {
        setData(d);
        setHeroImg(d.hero_image);
        setPosterReview(d.best_review);
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

  const makePoster = (review?: Review | null) => {
    const r = review ?? posterReview ?? data?.best_review ?? null;
    const img = selected || heroImg || data?.photos?.[0]?.image;
    if (!img) {
      toast("사진이 필요해요 — 사진·홍보물 탭에서 선택해주세요.", "info");
      return;
    }
    drawPoster(img, r?.rating ?? null, r?.comment ?? "");
    toast("홍보물 이미지를 저장했어요 — 인스타·카톡에 바로 쓰세요!", "success");
  };

  const filteredReviews = useMemo(() => {
    const list = data?.reviews ?? [];
    if (rFilter === "high") return list.filter((r) => (r.rating ?? 0) >= 4.5);
    if (rFilter === "photo") return list.filter((r) => !!r.image);
    return list;
  }, [data, rFilter]);

  if (loading)
    return (
      <div className="-m-4 min-h-full bg-[#FBF3E4] p-4 lg:-m-6 lg:p-6">
        <div className="py-16 text-center text-sm text-slate-400">불러오는 중...</div>
      </div>
    );

  const d = data;
  const isBest = (r: Review) => d?.best_review?.id === r.id;

  return (
    <div className="-m-4 min-h-full space-y-3 bg-[#FBF3E4] p-4 pb-24 lg:-m-6 lg:p-6 lg:pb-24">
      {/* 헤더 + 서브탭 */}
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-[17px] font-bold text-slate-900">손님 콘텐츠</h1>
          <p className="text-[11.5px] text-[#B49A6A]">손님이 만들어준 마케팅 자산 — 직접 안 찍어도 돼요</p>
        </div>
        <div className="ml-auto flex rounded-xl border border-[#F0E6D2] bg-white p-1">
          {([
            { k: "photos", l: "🖼 사진·홍보물" },
            { k: "reviews", l: "✍️ 후기" },
            { k: "lists", l: "🔖 담긴 리스트" },
          ] as { k: Tab; l: string }[]).map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                tab === t.k ? "bg-[#F5A623] text-white" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* 요약 스트립 */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {[
          { l: "손님 사진", v: `${d?.counts.photos ?? 0}장` },
          { l: "후기", v: `${d?.counts.reviews ?? 0}개` },
          { l: "담긴 리스트", v: `${d?.counts.curators ?? 0}개` },
          { l: "방문 인증", v: `${d?.counts.visitors ?? 0}명` },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl border border-[#F0E6D2] bg-white p-3 text-center">
            <div className="text-[15px] font-bold text-slate-900">{k.v}</div>
            <div className="text-[10px] text-[#B49A6A]">{k.l}</div>
          </div>
        ))}
      </div>

      {/* ─────────────── 🖼 사진·홍보물 ─────────────── */}
      {tab === "photos" && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[12px] font-bold text-slate-700">손님이 올린 사진</span>
            <span className="ml-auto text-[10.5px] text-[#B49A6A]">🔒 외부 사용은 동의받은 사진만 표시돼요</span>
          </div>
          {(d?.photos?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-12 text-center">
              <div className="text-2xl">📷</div>
              <p className="mt-2 text-sm text-slate-500">아직 손님 사진이 없어요.</p>
              <p className="mt-1 text-[11px] text-slate-400">손님이 게시물에 사진을 올리면 여기 모여요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {d!.photos.map((p) => {
                const on = selected === p.image;
                const isHero = heroImg === p.image;
                return (
                  <button
                    key={p.post_id}
                    onClick={() => setSelected(on ? null : p.image)}
                    className={`relative aspect-square overflow-hidden rounded-xl border transition-all ${
                      on ? "border-transparent outline outline-2 outline-[#F5A623] outline-offset-2" : "border-[#F0E6D2]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                    {on && (
                      <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#F5A623] text-[11px] font-bold text-white">✓</span>
                    )}
                    {isHero && (
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-semibold text-white">대표</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 하단 고정 액션바 — 선택하면 등장, 선택·조합·실행이 한 줄 */}
          {selected && (
            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#F0E6D2] bg-white/95 backdrop-blur lg:left-64">
              <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selected} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-[11.5px] font-semibold text-slate-800">1장 선택됨</div>
                  <button onClick={() => setReviewPick(true)} className="block max-w-full truncate text-[10.5px] text-[#B49A6A]">
                    {posterReview
                      ? <>홍보물 후기: &ldquo;{posterReview.comment.slice(0, 22)}{posterReview.comment.length > 22 ? "…" : ""}&rdquo; ★{(posterReview.rating ?? 5).toFixed(1)} <u>바꾸기</u></>
                      : <>홍보물 후기: 없음 <u>고르기</u></>}
                  </button>
                </div>
                <button
                  onClick={setHero}
                  disabled={saving || heroImg === selected}
                  className="shrink-0 rounded-xl border border-[#F0E6D2] bg-white px-3.5 py-2.5 text-[11.5px] font-semibold text-slate-600 disabled:opacity-40"
                >
                  {heroImg === selected ? "✓ 대표" : "⭐ 대표로"}
                </button>
                <button
                  onClick={() => makePoster()}
                  className="shrink-0 rounded-xl bg-[#F5A623] px-4 py-2.5 text-[11.5px] font-bold text-white hover:bg-[#e09415]"
                >
                  ✨ 홍보물 저장
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ─────────────── ✍️ 후기 ─────────────── */}
      {tab === "reviews" && (
        <>
          <div className="flex gap-1.5 pt-1">
            {([
              { k: "all", l: `전체 ${d?.reviews?.length ?? 0}` },
              { k: "high", l: `⭐ 4.5+ ${(d?.reviews ?? []).filter((r) => (r.rating ?? 0) >= 4.5).length}` },
              { k: "photo", l: `📷 사진 후기 ${(d?.reviews ?? []).filter((r) => !!r.image).length}` },
            ] as { k: ReviewFilter; l: string }[]).map((f) => (
              <button
                key={f.k}
                onClick={() => setRFilter(f.k)}
                className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  rFilter === f.k ? "bg-[#F5A623] text-white" : "border border-[#F0E6D2] bg-white text-slate-500"
                }`}
              >
                {f.l}
              </button>
            ))}
          </div>

          {filteredReviews.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-12 text-center">
              <div className="text-2xl">✍️</div>
              <p className="mt-2 text-sm text-slate-500">이 조건의 후기가 없어요.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReviews.map((r) => (
                <div key={r.id} className={`rounded-2xl border p-3.5 ${isBest(r) ? "border-[#F5A623] bg-[#FFF9EC]" : "border-[#F0E6D2] bg-white"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#EF9F27]">
                      {"★".repeat(Math.round(r.rating ?? 5))}
                      <b className="ml-1 text-[#854F0B]">{(r.rating ?? 0).toFixed(1)}</b>
                    </span>
                    {isBest(r) && <span className="rounded bg-[#F5A623] px-1.5 py-0.5 text-[9px] font-bold text-white">베스트</span>}
                    {r.image && <span className="text-[10.5px] text-[#B49A6A]">📷 사진 포함</span>}
                  </div>
                  {r.comment && <p className="mt-1.5 text-[13px] leading-relaxed text-slate-800">&ldquo;{r.comment}&rdquo;</p>}
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => { setPosterReview(r); makePoster(r); }}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                        isBest(r) ? "bg-[#F5A623] text-white" : "border border-[#F0E6D2] text-slate-600 hover:bg-[#FFF9EC]"
                      }`}
                    >
                      ✨ 이 후기로 홍보물
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="text-[10.5px] text-slate-400">💡 홍보물 사진은 대표 이미지(없으면 첫 사진)가 쓰여요 — 바꾸려면 사진·홍보물 탭에서 선택</p>
        </>
      )}

      {/* ─────────────── 🔖 담긴 리스트 ─────────────── */}
      {tab === "lists" && (
        <>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[12px] font-bold text-slate-700">우리 가게가 담긴 리스트</span>
            <span className="ml-auto text-[10.5px] text-[#B49A6A]">광고보다 강한 신뢰 자산</span>
          </div>
          {(d?.curators?.length ?? 0) === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-[#E7DCC2] bg-white py-12 text-center">
              <div className="text-2xl">🔖</div>
              <p className="mt-2 text-sm text-slate-500">아직 우리 가게를 담은 공개 리스트가 없어요.</p>
              <p className="mt-1 text-[11px] text-slate-400">크루·큐레이터가 리스트에 담으면 손님 앱 발견 피드에 우리 가게가 노출돼요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {d!.curators.map((c) => (
                <div key={c.folder_id} className="rounded-2xl border border-[#F0E6D2] bg-white p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAEEDA] text-lg">{c.icon || "📁"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-slate-900">{c.name}</div>
                      <div className="truncate text-[11px] text-slate-500">
                        {c.is_crew ? "👥 " : "✍️ "}{c.owner}
                        {(c.saves ?? 0) > 0 && <> · 담은 사람 <b className="text-[#854F0B]">{c.saves}</b></>}
                        {c.likes > 0 && <> · 추천 {c.likes}</>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="rounded-2xl bg-[#FFF9EC] px-3.5 py-2.5 text-[11.5px] text-[#854F0B]">
            💡 담긴 리스트를 늘리고 싶다면 — <b>제휴 탭</b>에서 크루 딜을 발행해보세요. 방문한 크루가 리스트에 담아줍니다.
          </div>
        </>
      )}

      {/* 후기 바꾸기 시트 (홍보물 조합용) */}
      {reviewPick && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center" onClick={() => setReviewPick(false)}>
          <div className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 lg:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-bold text-slate-900">홍보물에 넣을 후기 고르기</div>
            <div className="mt-3 space-y-2">
              {(d?.reviews ?? []).filter((r) => r.comment).map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setPosterReview(r); setReviewPick(false); }}
                  className={`block w-full rounded-xl border p-3 text-left ${
                    posterReview?.id === r.id ? "border-[#F5A623] bg-[#FFF9EC]" : "border-[#F0E6D2]"
                  }`}
                >
                  <span className="text-[11px] text-[#EF9F27]">{"★".repeat(Math.round(r.rating ?? 5))} <b className="text-[#854F0B]">{(r.rating ?? 0).toFixed(1)}</b></span>
                  {isBest(r) && <span className="ml-1.5 rounded bg-[#F5A623] px-1.5 py-0.5 text-[9px] font-bold text-white">베스트</span>}
                  <p className="mt-1 text-[12.5px] text-slate-700">&ldquo;{r.comment}&rdquo;</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
    const ratio = Math.max(W / img.width, (H * 0.62) / img.height);
    const iw = img.width * ratio;
    const ih = img.height * ratio;
    ctx.drawImage(img, (W - iw) / 2, 0, iw, ih);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
    ctx.fillStyle = "#F5A623";
    ctx.font = "48px sans-serif";
    ctx.fillText("★".repeat(Math.round(rating ?? 5)), 48, H * 0.62 + 80);
    ctx.fillStyle = "#1f2937";
    ctx.font = "bold 40px sans-serif";
    wrapText(ctx, `"${comment}"`, 48, H * 0.62 + 160, W - 96, 54);
    ctx.fillStyle = "#94a3b8";
    ctx.font = "28px sans-serif";
    ctx.fillText("랑데부 · 손님 후기", 48, H - 48);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "rendezvous-poster.png";
    a.click();
  };
  img.onerror = () => {
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
