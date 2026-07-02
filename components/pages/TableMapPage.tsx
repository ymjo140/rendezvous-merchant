"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";
import { useTableUnits } from "@/lib/hooks/useTableUnits";

// 🪑 테이블 맵 — 매장 평면도처럼 테이블을 배치하고, 탭 한 번으로
// 비어있음/사용중을 표시. 빈 테이블엔 '그 테이블만 할인'을 걸 수 있다.
// 상태가 바뀌면 손님 앱의 '지금 빈자리'(vacancy)가 자동 갱신된다.

type StoreTable = {
  id: number;
  place_id: number;
  label: string;
  capacity: number;
  pos_x: number;
  pos_y: number;
  is_empty: boolean;
  deal_percent: number | null;
};

const COLS = 6;
const ROWS = 8;
const DEALS = [null, 10, 20, 30] as const;

export function TableMapPage({ storeId }: { storeId?: string }) {
  const placeId = Number(storeId);
  const [tables, setTables] = useState<StoreTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoreTable | null>(null);
  const [addCell, setAddCell] = useState<{ x: number; y: number } | null>(null);
  const [addCapacity, setAddCapacity] = useState(4);
  const { data: units = [] } = useTableUnits(storeId);

  const load = async () => {
    if (!Number.isFinite(placeId)) return;
    const { data, error } = await supabase
      .from("store_tables")
      .select("*")
      .eq("place_id", placeId)
      .order("id", { ascending: true });
    if (!error) setTables((data ?? []) as StoreTable[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  const grid = useMemo(() => {
    const map = new Map<string, StoreTable>();
    tables.forEach((t) => map.set(`${t.pos_x},${t.pos_y}`, t));
    return map;
  }, [tables]);

  const emptyCount = tables.filter((t) => t.is_empty).length;
  const emptySeats = tables.filter((t) => t.is_empty).reduce((a, t) => a + t.capacity, 0);

  // 빈 테이블 유무 → places.vacancy_until 자동 동기화(있으면 2시간 연장, 없으면 끔)
  const syncVacancy = async (nextTables: StoreTable[]) => {
    const anyEmpty = nextTables.some((t) => t.is_empty);
    await supabase
      .from("places")
      .update({
        vacancy_until: anyEmpty ? new Date(Date.now() + 120 * 60_000).toISOString() : null,
      })
      .eq("id", placeId);
  };

  const addTable = async () => {
    if (!addCell) return;
    const label = `T${tables.length + 1}`;
    const { data, error } = await supabase
      .from("store_tables")
      .insert({
        place_id: placeId,
        label,
        capacity: addCapacity,
        pos_x: addCell.x,
        pos_y: addCell.y,
        is_empty: false,
      })
      .select("*")
      .single();
    if (error || !data) {
      toast("테이블 추가에 실패했어요.", "error");
      return;
    }
    setTables((prev) => [...prev, data as StoreTable]);
    setAddCell(null);
    toast(`${label} 테이블(${addCapacity}인) 추가!`, "success");
  };

  // 기존 '수용량' 등록 정보에서 자동 배치
  const importFromUnits = async () => {
    if (units.length === 0) {
      toast("수용량 메뉴에 등록된 테이블 정보가 없어요.", "error");
      return;
    }
    const rows: Omit<StoreTable, "id">[] = [];
    let idx = 0;
    units.forEach((u) => {
      for (let q = 0; q < (u.quantity || 1); q += 1) {
        rows.push({
          place_id: placeId,
          label: `${u.name || "T"}${q + 1}`,
          capacity: u.max_capacity || 4,
          pos_x: idx % COLS,
          pos_y: Math.floor(idx / COLS),
          is_empty: false,
          deal_percent: null,
        });
        idx += 1;
      }
    });
    const { data, error } = await supabase.from("store_tables").insert(rows).select("*");
    if (error) {
      toast("불러오기에 실패했어요.", "error");
      return;
    }
    setTables((prev) => [...prev, ...((data ?? []) as StoreTable[])]);
    toast(`${rows.length}개 테이블을 불러왔어요. 탭해서 위치·상태를 조정하세요.`, "success");
  };

  const updateTable = async (t: StoreTable, patch: Partial<StoreTable>) => {
    const { error } = await supabase.from("store_tables").update(patch).eq("id", t.id);
    if (error) {
      toast("저장에 실패했어요.", "error");
      return;
    }
    const next = tables.map((x) => (x.id === t.id ? { ...x, ...patch } : x));
    setTables(next);
    setSelected((prev) => (prev && prev.id === t.id ? { ...prev, ...patch } : prev));
    if ("is_empty" in patch) await syncVacancy(next);
  };

  const removeTable = async (t: StoreTable) => {
    const { error } = await supabase.from("store_tables").delete().eq("id", t.id);
    if (error) {
      toast("삭제에 실패했어요.", "error");
      return;
    }
    const next = tables.filter((x) => x.id !== t.id);
    setTables(next);
    setSelected(null);
    await syncVacancy(next);
  };

  return (
    <div className="space-y-4 pb-40">
      <div>
        <h1 className="text-2xl font-semibold">🪑 테이블 맵</h1>
        <p className="text-sm text-slate-500">
          빈 칸을 탭해 테이블을 놓고, 테이블을 탭해 <b>비어있음</b>을 표시하세요. 손님 앱에 실시간 반영돼요.
        </p>
      </div>

      {/* 현황 요약 */}
      <Card className={emptyCount > 0 ? "border-emerald-300 bg-emerald-50/50" : ""}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="text-sm">
            {emptyCount > 0 ? (
              <span className="font-bold text-emerald-700">
                🟢 지금 {emptyCount}테이블 · 최대 {emptySeats}명 앉을 수 있어요
              </span>
            ) : (
              <span className="text-slate-500">지금 비어있는 테이블이 없어요</span>
            )}
            <div className="text-xs text-slate-400 mt-0.5">손님 앱 &lsquo;지금 빈자리&rsquo;에 자동 반영</div>
          </div>
          {tables.length === 0 && units.length > 0 && (
            <Button onClick={importFromUnits} variant="secondary" className="text-xs h-9">
              📥 수용량 정보에서 불러오기
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 테이블 맵 격자 */}
      <Card>
        <CardContent className="p-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
          ) : (
            <div
              className="grid gap-1.5 rounded-xl bg-slate-100 p-2"
              style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: COLS * ROWS }, (_, i) => {
                const x = i % COLS;
                const y = Math.floor(i / COLS);
                const t = grid.get(`${x},${y}`);
                if (!t) {
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelected(null);
                        setAddCell({ x, y });
                      }}
                      className={`aspect-square rounded-lg border-2 border-dashed transition-colors ${
                        addCell?.x === x && addCell?.y === y
                          ? "border-brand bg-amber-50"
                          : "border-slate-200 bg-white/60 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-slate-300 text-lg">+</span>
                    </button>
                  );
                }
                const isSel = selected?.id === t.id;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setAddCell(null);
                      setSelected(t);
                    }}
                    className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                      t.is_empty
                        ? "border-emerald-400 bg-emerald-100"
                        : "border-slate-300 bg-slate-300/70"
                    } ${isSel ? "ring-2 ring-brand ring-offset-1" : ""}`}
                  >
                    <span className="text-[11px] font-bold text-slate-700">{t.label}</span>
                    <span className="text-[10px] text-slate-500">{t.capacity}인</span>
                    {t.is_empty && t.deal_percent ? (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{t.deal_percent}%
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex gap-4 text-[11px] text-slate-500">
            <span>🟩 비어있음</span>
            <span>⬜ 사용중</span>
            <span>🔴 -N% = 그 테이블만 할인</span>
          </div>
        </CardContent>
      </Card>

      {/* 하단 액션 패널 — 테이블 추가 */}
      {addCell && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <div className="text-sm font-bold text-slate-700 flex-shrink-0">새 테이블</div>
            <div className="flex gap-1">
              {[2, 4, 6, 8].map((c) => (
                <button
                  key={c}
                  onClick={() => setAddCapacity(c)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    addCapacity === c ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c}인
                </button>
              ))}
            </div>
            <Button onClick={addTable} className="ml-auto bg-brand hover:bg-brand-dark">
              여기에 추가
            </Button>
            <Button variant="ghost" onClick={() => setAddCell(null)}>
              취소
            </Button>
          </div>
        </div>
      )}

      {/* 하단 액션 패널 — 테이블 관리 */}
      {selected && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-800">
                {selected.label} · {selected.capacity}인석
                {selected.is_empty ? (
                  <span className="ml-2 text-emerald-600 text-xs font-bold">🟢 비어있음</span>
                ) : (
                  <span className="ml-2 text-slate-400 text-xs">사용중</span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={() => removeTable(selected)} className="text-xs text-rose-400 hover:text-rose-600">
                  삭제
                </button>
                <button onClick={() => setSelected(null)} className="text-xs text-slate-400">
                  닫기
                </button>
              </div>
            </div>

            <Button
              onClick={() =>
                updateTable(selected, {
                  is_empty: !selected.is_empty,
                  deal_percent: selected.is_empty ? null : selected.deal_percent,
                })
              }
              className={`w-full h-12 text-base font-bold ${
                selected.is_empty
                  ? "bg-slate-500 hover:bg-slate-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
            >
              {selected.is_empty ? "⬜ 사용중으로 바꾸기" : "🟢 비어있음으로 바꾸기"}
            </Button>

            {selected.is_empty && (
              <div>
                <div className="mb-1.5 text-xs font-bold text-slate-500">
                  💸 이 테이블만 할인 (빨리 채우고 싶을 때)
                </div>
                <div className="flex gap-2">
                  {DEALS.map((d) => (
                    <button
                      key={String(d)}
                      onClick={() => updateTable(selected, { deal_percent: d })}
                      className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors ${
                        selected.deal_percent === d
                          ? "border-rose-400 bg-rose-50 text-rose-600"
                          : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    >
                      {d ? `-${d}%` : "할인 없음"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
