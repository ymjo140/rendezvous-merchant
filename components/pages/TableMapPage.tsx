"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/toaster";
import { useTableUnits } from "@/lib/hooks/useTableUnits";

// 🪑 테이블 맵 v2 — 수용량 메뉴 통합판.
// 모양(네모/원형/긴/바)·인원·위치속성(홀/창가/룸/야외/바)으로 테이블을 배치하고,
// 탭 한 번으로 🟢비어있음/⬜사용중/🟡예약석 전환. 빈 테이블엔 '그 테이블만 할인'.
// 룸/야외 테이블이 있으면 손님 앱 필터(룸·루프탑)에 자동 태깅된다.

type TableStatus = "empty" | "occupied" | "reserved";
type TableShape = "square" | "round" | "long" | "bar";
type ZoneType = "hall" | "window" | "room" | "outdoor" | "bar";

type StoreTable = {
  id: number;
  place_id: number;
  label: string;
  capacity: number;
  max_capacity: number | null;
  shape: TableShape;
  zone_type: ZoneType;
  pos_x: number;
  pos_y: number;
  rotated: boolean;
  status: TableStatus;
  is_empty: boolean; // 하위호환(항상 status==='empty'와 동기화해 저장)
  deal_percent: number | null;
};

const COLS = 6;
const ROWS = 8;
const DEALS = [null, 10, 20, 30] as const;

const SHAPES: { key: TableShape; label: string; icon: string }[] = [
  { key: "square", label: "네모", icon: "⬜" },
  { key: "round", label: "원형", icon: "⚪" },
  { key: "long", label: "긴 테이블", icon: "▭" },
  { key: "bar", label: "바(bar)", icon: "🍸" },
];

const ZONES: { key: ZoneType; label: string }[] = [
  { key: "hall", label: "홀" },
  { key: "window", label: "창가" },
  { key: "room", label: "룸" },
  { key: "outdoor", label: "야외" },
  { key: "bar", label: "바" },
];

const ZONE_LABEL: Record<ZoneType, string> = {
  hall: "홀", window: "창가", room: "룸", outdoor: "야외", bar: "바",
};

const STATUS_STYLE: Record<TableStatus, string> = {
  empty: "border-emerald-400 bg-emerald-100",
  occupied: "border-slate-300 bg-slate-300/70",
  reserved: "border-amber-400 bg-amber-100",
};

/** long 테이블이 차지하는 셀들(가로 2칸 또는 세로 2칸) */
function cellsOf(t: Pick<StoreTable, "pos_x" | "pos_y" | "shape" | "rotated">): [number, number][] {
  const cells: [number, number][] = [[t.pos_x, t.pos_y]];
  if (t.shape === "long") {
    cells.push(t.rotated ? [t.pos_x, t.pos_y + 1] : [t.pos_x + 1, t.pos_y]);
  }
  return cells;
}

export function TableMapPage({ storeId }: { storeId?: string }) {
  const placeId = Number(storeId);
  const [tables, setTables] = useState<StoreTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StoreTable | null>(null);
  const [addCell, setAddCell] = useState<{ x: number; y: number } | null>(null);
  const [addShape, setAddShape] = useState<TableShape>("square");
  const [addCapacity, setAddCapacity] = useState(4);
  const [addZone, setAddZone] = useState<ZoneType>("hall");
  const [moveMode, setMoveMode] = useState(false);
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

  // 점유 셀 집합(긴 테이블은 2칸)
  const covered = useMemo(() => {
    const map = new Map<string, StoreTable>();
    tables.forEach((t) => cellsOf(t).forEach(([x, y]) => map.set(`${x},${y}`, t)));
    return map;
  }, [tables]);

  const emptyTables = tables.filter((t) => t.status === "empty");
  const emptySeats = emptyTables.reduce((a, t) => a + t.capacity, 0);
  const totalSeats = tables.reduce((a, t) => a + t.capacity, 0);

  // 상태 변경 → 손님앱 신호(vacancy) + 룸/야외 시설 자동 태깅(추가만, 삭제 안 함)
  const syncPlaceMeta = async (nextTables: StoreTable[]) => {
    const anyEmpty = nextTables.some((t) => t.status === "empty");
    const patch: Record<string, any> = {
      vacancy_until: anyEmpty ? new Date(Date.now() + 120 * 60_000).toISOString() : null,
    };
    try {
      const featAdd: Record<string, boolean> = {};
      if (nextTables.some((t) => t.zone_type === "room")) featAdd.private_room = true;
      if (nextTables.some((t) => t.zone_type === "outdoor")) featAdd.rooftop = true;
      if (Object.keys(featAdd).length > 0) {
        const { data } = await supabase.from("places").select("features").eq("id", placeId).maybeSingle();
        const feat = data?.features && typeof data.features === "object" ? data.features : {};
        patch.features = { ...feat, ...featAdd };
      }
    } catch {
      /* 태깅 실패는 무시(신호가 우선) */
    }
    await supabase.from("places").update(patch).eq("id", placeId);
  };

  const canPlace = (x: number, y: number, shape: TableShape, rotated: boolean, ignoreId?: number) => {
    const cells = cellsOf({ pos_x: x, pos_y: y, shape, rotated });
    return cells.every(([cx, cy]) => {
      if (cx >= COLS || cy >= ROWS) return false;
      const hit = covered.get(`${cx},${cy}`);
      return !hit || hit.id === ignoreId;
    });
  };

  const addTable = async () => {
    if (!addCell) return;
    const rotated = addShape === "long" && !canPlace(addCell.x, addCell.y, "long", false)
      ? true
      : false;
    if (!canPlace(addCell.x, addCell.y, addShape, rotated)) {
      toast("자리가 부족해요. 다른 칸을 선택해주세요.", "error");
      return;
    }
    const label = `T${tables.length + 1}`;
    const { data, error } = await supabase
      .from("store_tables")
      .insert({
        place_id: placeId,
        label,
        capacity: addCapacity,
        shape: addShape,
        zone_type: addZone,
        pos_x: addCell.x,
        pos_y: addCell.y,
        rotated,
        status: "occupied",
        is_empty: false,
      })
      .select("*")
      .single();
    if (error || !data) {
      toast("테이블 추가에 실패했어요.", "error");
      return;
    }
    const next = [...tables, data as StoreTable];
    setTables(next);
    setAddCell(null);
    syncPlaceMeta(next);
    toast(`${label} · ${ZONE_LABEL[addZone]} ${addCapacity}인 추가!`, "success");
  };

  // 기존 '수용량' 등록 정보에서 자동 배치
  const importFromUnits = async () => {
    if (units.length === 0) {
      toast("기존 수용량 정보가 없어요. 빈 칸을 탭해 직접 추가해주세요.", "error");
      return;
    }
    const rows: any[] = [];
    let idx = 0;
    units.forEach((u) => {
      for (let q = 0; q < (u.quantity || 1); q += 1) {
        rows.push({
          place_id: placeId,
          label: `${u.name || "T"}${q + 1}`,
          capacity: u.max_capacity || 4,
          shape: "square",
          zone_type: "hall",
          pos_x: idx % COLS,
          pos_y: Math.floor(idx / COLS),
          rotated: false,
          status: "occupied",
          is_empty: false,
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
    toast(`${rows.length}개 테이블을 불러왔어요. 탭해서 모양·위치를 다듬어주세요.`, "success");
  };

  const updateTable = async (t: StoreTable, patch: Partial<StoreTable>) => {
    // status 변경 시 하위호환 is_empty 동기 저장
    if (patch.status) patch.is_empty = patch.status === "empty";
    const { error } = await supabase.from("store_tables").update(patch).eq("id", t.id);
    if (error) {
      toast("저장에 실패했어요.", "error");
      return;
    }
    const next = tables.map((x) => (x.id === t.id ? { ...x, ...patch } : x));
    setTables(next);
    setSelected((prev) => (prev && prev.id === t.id ? { ...prev, ...patch } : prev));
    if ("status" in patch || "zone_type" in patch) await syncPlaceMeta(next);
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
    setMoveMode(false);
    await syncPlaceMeta(next);
  };

  const moveTo = async (x: number, y: number) => {
    if (!selected) return;
    if (!canPlace(x, y, selected.shape, selected.rotated, selected.id)) {
      toast("그 자리엔 놓을 수 없어요.", "error");
      return;
    }
    await updateTable(selected, { pos_x: x, pos_y: y });
    setMoveMode(false);
    toast("이동 완료!", "success");
  };

  // 일괄 리셋 — 영업 시작/마감용
  const bulkStatus = async (status: TableStatus) => {
    const { error } = await supabase
      .from("store_tables")
      .update({ status, is_empty: status === "empty", deal_percent: null })
      .eq("place_id", placeId);
    if (error) {
      toast("일괄 변경에 실패했어요.", "error");
      return;
    }
    const next = tables.map((t) => ({ ...t, status, is_empty: status === "empty", deal_percent: null }));
    setTables(next);
    setSelected(null);
    await syncPlaceMeta(next);
    toast(status === "empty" ? "전부 비움으로 변경!" : "전부 사용중으로 변경!", "success");
  };

  return (
    <div className="space-y-4 pb-44">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">🪑 테이블 맵</h1>
          <p className="text-sm text-slate-500">
            테이블 배치·인원·빈자리를 한 곳에서 관리해요. (기존 &lsquo;수용량&rsquo; 메뉴 통합)
          </p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <Button variant="secondary" className="h-8 text-xs" onClick={() => bulkStatus("empty")}>
            전부 비움
          </Button>
          <Button variant="secondary" className="h-8 text-xs" onClick={() => bulkStatus("occupied")}>
            전부 사용중
          </Button>
        </div>
      </div>

      {/* 현황 요약 */}
      <Card className={emptyTables.length > 0 ? "border-emerald-300 bg-emerald-50/50" : ""}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="text-sm">
            {emptyTables.length > 0 ? (
              <span className="font-bold text-emerald-700">
                🟢 지금 {emptyTables.length}테이블 · 최대 {emptySeats}명 앉을 수 있어요
              </span>
            ) : (
              <span className="text-slate-500">지금 비어있는 테이블이 없어요</span>
            )}
            <div className="text-xs text-slate-400 mt-0.5">
              총 {tables.length}테이블 · {totalSeats}석 · 손님 앱 &lsquo;지금 빈자리&rsquo;에 자동 반영
            </div>
          </div>
          {tables.length === 0 && units.length > 0 && (
            <Button onClick={importFromUnits} variant="secondary" className="text-xs h-9">
              📥 기존 수용량에서 불러오기
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 이동 모드 안내 */}
      {moveMode && selected && (
        <div className="rounded-xl bg-sky-50 border border-sky-200 px-4 py-2.5 text-sm font-bold text-sky-700 flex items-center justify-between">
          <span>📍 {selected.label} 테이블을 옮길 칸을 탭하세요</span>
          <button onClick={() => setMoveMode(false)} className="text-xs text-sky-500">취소</button>
        </div>
      )}

      {/* 테이블 맵 격자 */}
      <Card>
        <CardContent className="p-3">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-400">불러오는 중...</p>
          ) : (
            <div
              className="grid gap-1.5 rounded-xl bg-slate-100 p-2"
              style={{
                gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                gridAutoRows: "1fr",
              }}
            >
              {/* 빈 칸 (+) */}
              {Array.from({ length: COLS * ROWS }, (_, i) => {
                const x = i % COLS;
                const y = Math.floor(i / COLS);
                if (covered.has(`${x},${y}`)) return null;
                return (
                  <button
                    key={`cell-${i}`}
                    style={{ gridColumnStart: x + 1, gridRowStart: y + 1 }}
                    onClick={() => {
                      if (moveMode) {
                        moveTo(x, y);
                        return;
                      }
                      setSelected(null);
                      setAddCell({ x, y });
                    }}
                    className={`aspect-square rounded-lg border-2 border-dashed transition-colors ${
                      addCell?.x === x && addCell?.y === y
                        ? "border-brand bg-amber-50"
                        : moveMode
                        ? "border-sky-300 bg-sky-50/60 hover:border-sky-400"
                        : "border-slate-200 bg-white/60 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-slate-300 text-lg">{moveMode ? "📍" : "+"}</span>
                  </button>
                );
              })}

              {/* 테이블 */}
              {tables.map((t) => {
                const isSel = selected?.id === t.id;
                const spanCol = t.shape === "long" && !t.rotated ? 2 : 1;
                const spanRow = t.shape === "long" && t.rotated ? 2 : 1;
                return (
                  <button
                    key={`t-${t.id}`}
                    style={{
                      gridColumnStart: t.pos_x + 1,
                      gridRowStart: t.pos_y + 1,
                      gridColumnEnd: `span ${spanCol}`,
                      gridRowEnd: `span ${spanRow}`,
                    }}
                    onClick={() => {
                      setAddCell(null);
                      setSelected(t);
                      setMoveMode(false);
                    }}
                    className={`relative border-2 flex flex-col items-center justify-center transition-all min-h-0 ${
                      t.shape === "round" ? "rounded-full aspect-square" : "rounded-lg"
                    } ${t.shape !== "long" ? "aspect-square" : ""} ${STATUS_STYLE[t.status] || STATUS_STYLE.occupied} ${
                      isSel ? "ring-2 ring-brand ring-offset-1" : ""
                    }`}
                  >
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">
                      {t.shape === "bar" ? "🍸" : ""}{t.label}
                    </span>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      {t.capacity}인{t.zone_type !== "hall" ? ` · ${ZONE_LABEL[t.zone_type]}` : ""}
                    </span>
                    {t.status === "reserved" && (
                      <span className="text-[9px] font-bold text-amber-600">예약석</span>
                    )}
                    {t.status === "empty" && t.deal_percent ? (
                      <span className="absolute -top-1.5 -right-1.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        -{t.deal_percent}%
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>🟩 비어있음</span>
            <span>⬜ 사용중</span>
            <span>🟨 예약석</span>
            <span>🔴 -N% = 그 테이블만 할인</span>
          </div>
        </CardContent>
      </Card>

      {/* 하단 패널 — 테이블 추가 */}
      {addCell && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-700">새 테이블</div>
              <button onClick={() => setAddCell(null)} className="text-xs text-slate-400">취소</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {SHAPES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => {
                      setAddShape(s.key);
                      if (s.key === "long" && addCapacity < 6) setAddCapacity(6);
                      if (s.key === "bar") setAddCapacity(1);
                    }}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      addShape === s.key ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1">
                {(addShape === "bar" ? [1, 2, 3, 4] : [2, 4, 6, 8, 10]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setAddCapacity(c)}
                    className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                      addCapacity === c ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {c}인
                  </button>
                ))}
              </div>
              <span className="text-slate-200">|</span>
              <div className="flex gap-1">
                {ZONES.map((z) => (
                  <button
                    key={z.key}
                    onClick={() => setAddZone(z.key)}
                    className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ${
                      addZone === z.key ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {z.label}
                  </button>
                ))}
              </div>
              <Button onClick={addTable} className="ml-auto bg-brand hover:bg-brand-dark">
                여기에 추가
              </Button>
            </div>
            {(addZone === "room" || addZone === "outdoor") && (
              <p className="text-[11px] text-teal-600">
                💡 {addZone === "room" ? "룸" : "야외"} 테이블을 등록하면 손님 앱 필터(
                {addZone === "room" ? "룸/프라이빗" : "루프탑/야외"})에도 자동 반영돼요.
              </p>
            )}
          </div>
        </div>
      )}

      {/* 하단 패널 — 테이블 관리 */}
      {selected && !moveMode && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl">
          <div className="mx-auto max-w-3xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-slate-800">
                {selected.label} · {ZONE_LABEL[selected.zone_type]} {selected.capacity}인
                <span className="ml-2 text-xs">
                  {selected.status === "empty" && <span className="text-emerald-600 font-bold">🟢 비어있음</span>}
                  {selected.status === "occupied" && <span className="text-slate-400">⬜ 사용중</span>}
                  {selected.status === "reserved" && <span className="text-amber-600 font-bold">🟡 예약석</span>}
                </span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setMoveMode(true)} className="text-xs text-sky-500 hover:text-sky-700 font-bold">
                  📍 이동
                </button>
                <button onClick={() => removeTable(selected)} className="text-xs text-rose-400 hover:text-rose-600">
                  삭제
                </button>
                <button onClick={() => setSelected(null)} className="text-xs text-slate-400">
                  닫기
                </button>
              </div>
            </div>

            {/* 상태 3버튼 */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { key: "empty", label: "🟢 비어있음", cls: "border-emerald-400 bg-emerald-50 text-emerald-700" },
                { key: "occupied", label: "⬜ 사용중", cls: "border-slate-300 bg-slate-50 text-slate-600" },
                { key: "reserved", label: "🟡 예약석", cls: "border-amber-400 bg-amber-50 text-amber-700" },
              ] as { key: TableStatus; label: string; cls: string }[]).map((s) => (
                <button
                  key={s.key}
                  onClick={() =>
                    updateTable(selected, {
                      status: s.key,
                      deal_percent: s.key === "empty" ? selected.deal_percent : null,
                    })
                  }
                  className={`rounded-xl border-2 py-3 text-sm font-bold transition-all ${
                    selected.status === s.key ? s.cls + " ring-1 ring-offset-1" : "border-slate-200 text-slate-400"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {selected.status === "empty" && (
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
